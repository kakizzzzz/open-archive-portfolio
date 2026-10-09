export interface ScreenVideoRenderer {
  setReveal(x: number, y: number, active: boolean): void;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_video;
uniform vec2 u_pointer;
uniform vec2 u_crop;
uniform float u_reveal;
varying vec2 v_uv;
void main() {
  // Preserve object-fit: cover if the template's media is replaced by another aspect ratio.
  vec2 videoUV = vec2(0.5) + (v_uv - vec2(0.5)) * u_crop;
  vec3 color = texture2D(u_video, videoUV).rgb;
  float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
  // Pointer coordinates use the DOM's top-left origin. Measure in screen widths.
  vec2 distanceFromPointer = vec2(v_uv.x, 1.0 - v_uv.y) - u_pointer;
  distanceFromPointer.y /= 1.5;
  float distance = length(distanceFromPointer);
  float radius = 170.0 / 450.0;
  float reveal = (1.0 - smoothstep(radius * 0.27, radius, distance)) * u_reveal;
  float glow = (1.0 - smoothstep(0.0, radius * 0.82, distance)) * u_reveal * 0.085;
  vec3 mixedColor = mix(vec3(gray), color, reveal);
  gl_FragColor = vec4(mix(mixedColor, vec3(1.0), glow), 1.0);
}`;

const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.5;

/** One decoder and one GPU pass; pointer updates never upload another video frame. */
export function createScreenVideoRenderer(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  onReady: (ready: boolean) => void,
): ScreenVideoRenderer | null {
  let gl: WebGLRenderingContext | null;
  try {
    gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power',
    });
  } catch { onReady(false); return null; }
  if (!gl) { onReady(false); return null; }

  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  const releaseResources = () => {
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  };
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Video shader allocation failed');
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Video shader compilation failed');
    return shader;
  };
  let pointerUniform: WebGLUniformLocation;
  let cropUniform: WebGLUniformLocation;
  let revealUniform: WebGLUniformLocation;
  try {
    program = gl.createProgram();
    if (!program) throw new Error('Video program allocation failed');
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Video program linking failed');
    const position = gl.getAttribLocation(program, 'a_position');
    const pointer = gl.getUniformLocation(program, 'u_pointer');
    const crop = gl.getUniformLocation(program, 'u_crop');
    const reveal = gl.getUniformLocation(program, 'u_reveal');
    const sampler = gl.getUniformLocation(program, 'u_video');
    buffer = gl.createBuffer();
    texture = gl.createTexture();
    if (position < 0 || !pointer || !crop || !reveal || !sampler || !buffer || !texture) throw new Error('Video resources unavailable');
    pointerUniform = pointer;
    cropUniform = crop;
    revealUniform = reveal;
    // Bound the render cost even on Retina displays and during the screen zoom.
    canvas.width = 900;
    canvas.height = 600;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.useProgram(program);
    gl.uniform1i(sampler, 0);
    gl.uniform2f(cropUniform, 1, 1);
  } catch {
    releaseResources();
    onReady(false);
    return null;
  }

  let enabled = false;
  let disposed = false;
  let failed = false;
  let ready = false;
  let textured = false;
  let videoFrameId: number | null = null;
  let animationId: number | null = null;
  let uploadedTime = Number.NaN;
  let textureWidth = 1;
  let textureHeight = 1;
  let cropX = 1;
  let cropY = 1;
  let cropDirty = false;
  let presentedFrames = -1;
  let fallbackPresentedFrames = -1;
  let fallbackUploadedAt = -Infinity;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let strength = 0;
  let target = 0;
  let fadeFrom = 0;
  let fadeStarted = 0;
  let dirty = false;
  const usesVideoFrames = typeof video.requestVideoFrameCallback === 'function';
  const isActive = () => enabled && !document.hidden && !disposed && !failed;
  const hasFrame = () => video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
  const isPlaying = () => isActive() && !video.paused && !video.ended && hasFrame();
  const markReady = (value: boolean) => {
    if (value !== ready) { ready = value; onReady(value); }
  };
  const cancelFrames = () => {
    if (animationId !== null) window.cancelAnimationFrame(animationId);
    if (videoFrameId !== null) video.cancelVideoFrameCallback(videoFrameId);
    animationId = videoFrameId = null;
  };
  const fail = () => {
    if (failed || disposed) return;
    failed = true;
    cancelFrames();
    if (ready) markReady(false);
    else onReady(false);
  };
  const fade = (now: number) => {
    const t = Math.min(1, Math.max(0, (now - fadeStarted) / 320));
    strength = fadeFrom + (target - fadeFrom) * t * t * (3 - 2 * t);
    return t < 1 && strength !== target;
  };
  const draw = () => {
    if (!isActive() || !textured) return;
    try {
      gl.useProgram(program);
      if (cropDirty) {
        gl.uniform2f(cropUniform, cropX, cropY);
        cropDirty = false;
      }
      gl.uniform2f(pointerUniform, pointerX, pointerY);
      gl.uniform1f(revealUniform, strength);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      dirty = false;
      markReady(true);
    } catch { fail(); }
  };
  const upload = (time: number) => {
    if (!isActive() || !hasFrame() || (textured && uploadedTime === time)) return;
    try {
      // Keep video uploads together before program/draw calls and reuse the allocation.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (textureWidth !== video.videoWidth || textureHeight !== video.videoHeight) {
        textureWidth = video.videoWidth;
        textureHeight = video.videoHeight;
        const aspect = textureWidth / textureHeight;
        cropX = Math.min(1, 1.5 / aspect);
        cropY = Math.min(1, aspect / 1.5);
        cropDirty = true;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
      uploadedTime = time;
      textured = true;
      dirty = true;
    } catch { fail(); }
  };
  const scheduleAnimation = () => {
    if (animationId === null && isPlaying()) animationId = window.requestAnimationFrame(animate);
  };
  const animate = (now: number) => {
    animationId = null;
    if (!isPlaying()) return;
    const previousStrength = strength;
    const fading = fade(now);
    if (!usesVideoFrames) {
      const totalFrames = typeof video.getVideoPlaybackQuality === 'function'
        ? video.getVideoPlaybackQuality().totalVideoFrames : 0;
      if (totalFrames > 0) {
        if (totalFrames !== fallbackPresentedFrames) {
          fallbackPresentedFrames = totalFrames;
          upload(video.currentTime);
        }
      } else if (now - fallbackUploadedAt >= 1000 / 30) {
        // Older browsers expose only the playback clock; cap texture updates at 30 fps.
        fallbackUploadedAt = now;
        upload(video.currentTime);
      }
    }
    if (dirty || fading || previousStrength !== strength) draw();
    if (!usesVideoFrames || fading) scheduleAnimation();
  };
  const scheduleVideoFrame = () => {
    if (usesVideoFrames && videoFrameId === null && isPlaying()) {
      videoFrameId = video.requestVideoFrameCallback((now, metadata) => {
        videoFrameId = null;
        if (!isPlaying()) return;
        if (metadata.presentedFrames !== presentedFrames) {
          presentedFrames = metadata.presentedFrames;
          upload(metadata.mediaTime);
          fade(now);
          draw();
        }
        scheduleVideoFrame();
      });
    }
  };
  const sync = () => {
    if (!isActive() || video.paused || video.ended) {
      cancelFrames();
      fadeFrom = strength = target;
      fadeStarted = performance.now() - 320;
      // A paused load/seek establishes a fresh image without leaving any callback running.
      if (isActive()) { upload(video.currentTime); draw(); }
      return;
    }
    scheduleVideoFrame();
    if (!usesVideoFrames || dirty || strength !== target) scheduleAnimation();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    fail(); // The native video remains the fallback, including after context restoration.
  };
  const videoEvents = ['playing', 'pause', 'ended', 'loadeddata', 'seeked'] as const;
  videoEvents.forEach(event => video.addEventListener(event, sync));
  video.addEventListener('error', fail);
  document.addEventListener('visibilitychange', sync);
  canvas.addEventListener('webglcontextlost', onContextLost);

  return {
    setReveal(x, y, active) {
      if (disposed || failed) return;
      pointerX = clamp(x);
      pointerY = clamp(y);
      const next = active ? 1 : 0;
      if (target !== next) {
        fade(performance.now());
        fadeFrom = strength;
        target = next;
        fadeStarted = performance.now();
      }
      dirty = true;
      if (isPlaying()) scheduleAnimation();
      else if (isActive()) {
        fadeFrom = strength = target;
        fadeStarted = performance.now() - 320;
        draw();
      }
    },
    setEnabled(value) {
      if (disposed || failed) return;
      enabled = value;
      sync();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelFrames();
      videoEvents.forEach(event => video.removeEventListener(event, sync));
      video.removeEventListener('error', fail);
      document.removeEventListener('visibilitychange', sync);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      ready = false;
      onReady(false);
      releaseResources();
    },
  };
}
