import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { introMedia, templateProfile } from './content';
import { createScreenVideoRenderer, type ScreenVideoRenderer } from './screenVideoRenderer';

type ComputerIntroProps = {
  onEnter: (rect: DOMRect) => void;
  width: number;
  scale: number;
  loadingProgress: number | null;
  playVideo: boolean;
  reducedMotion: boolean;
};

export default function ComputerIntro({ onEnter, width: computerWidth, scale, loadingProgress, playVideo, reducedMotion }: ComputerIntroProps) {
  const screenRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ScreenVideoRenderer | null>(null);
  const revealPointRef = useRef({ x: 0.5, y: 0.5 });
  const screenRectRef = useRef<DOMRect | null>(null);
  const hoverAllowedRef = useRef(false);
  const pointerInsideRef = useRef(false);
  const keyboardFocusRef = useRef(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [hoverCapable, setHoverCapable] = useState(false);
  const [screenOn, setScreenOn] = useState(true);
  const videoEnabled = playVideo && screenOn;

  const syncReveal = () => {
    if (!pointerInsideRef.current && keyboardFocusRef.current) {
      revealPointRef.current = { x: 0.5, y: 0.5 };
    }
    rendererRef.current?.setReveal(
      revealPointRef.current.x,
      revealPointRef.current.y,
      pointerInsideRef.current || keyboardFocusRef.current,
    );
  };

  const moveReveal = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse' || !hoverAllowedRef.current) return;
    const rect = screenRectRef.current ?? event.currentTarget.getBoundingClientRect();
    screenRectRef.current = rect;
    if (!rect.width || !rect.height) return;
    revealPointRef.current = {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
    pointerInsideRef.current = true;
    syncReveal();
  };

  useEffect(() => {
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const clearPointerReveal = () => {
      pointerInsideRef.current = false;
      screenRectRef.current = null;
      syncReveal();
    };
    const updatePointerMode = () => {
      hoverAllowedRef.current = pointerQuery.matches;
      setHoverCapable(pointerQuery.matches);
      if (!pointerQuery.matches) clearPointerReveal();
    };
    const invalidateRect = () => { screenRectRef.current = null; };
    const onVisibilityChange = () => {
      if (document.hidden) clearPointerReveal();
    };
    updatePointerMode();
    pointerQuery.addEventListener('change', updatePointerMode);
    window.addEventListener('resize', invalidateRect);
    window.addEventListener('blur', clearPointerReveal);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      pointerQuery.removeEventListener('change', updatePointerMode);
      window.removeEventListener('resize', invalidateRect);
      window.removeEventListener('blur', clearPointerReveal);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => { screenRectRef.current = null; }, [computerWidth, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const screen = screenRef.current;
    if (!canvas || !video || !screen || reducedMotion || !hoverCapable || !introMedia.src) return;
    const renderer = createScreenVideoRenderer(canvas, video, ready => {
      screen.dataset.gpuReady = String(ready);
    });
    rendererRef.current = renderer;
    renderer?.setEnabled(videoEnabled);
    syncReveal();
    return () => {
      renderer?.dispose();
      rendererRef.current = null;
      delete screen.dataset.gpuReady;
    };
  }, [reducedMotion, hoverCapable, introMedia.src]);

  useEffect(() => {
    // A scroll can hide the screen without sending a pointer-leave event.
    if (!videoEnabled) {
      pointerInsideRef.current = false;
      keyboardFocusRef.current = false;
      screenRectRef.current = null;
      syncReveal();
    }
    rendererRef.current?.setEnabled(videoEnabled && !reducedMotion);
  }, [videoEnabled, reducedMotion, hoverCapable]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let active = true;
    const syncPlayback = () => {
      if (videoEnabled && !reducedMotion && !document.hidden) {
        video.muted = true;
        // Autoplay can be declined by the browser; keep the poster as a fallback.
        void video.play().catch((error: unknown) => {
          // A quick scroll or tab switch may cancel a pending play request.
          if (active && !(error instanceof DOMException && error.name === 'AbortError')) setPlaybackFailed(true);
        });
      } else video.pause();
    };
    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      active = false;
      video.pause();
      document.removeEventListener('visibilitychange', syncPlayback);
    };
  }, [videoEnabled, reducedMotion, introMedia.src]);

  const openArchive = () => {
    if (screenRef.current) onEnter(screenRef.current.getBoundingClientRect());
  };

  return (
    <section className="archive-computer-intro" aria-label="Portfolio introduction">
      <div className="archive-intro-center">
        <div className="archive-computer-stage" style={{ '--computer-unit': computerWidth / 740, width: computerWidth, position: 'relative', aspectRatio: '740 / 550', transform: `scale(${scale})` } as CSSProperties}>
          <svg
            className="archive-computer-illustration"
            viewBox="0 0 740 550"
            width="740"
            height="550"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            {/* A frontal silhouette built entirely from solid graphic shapes. */}
            <g stroke="#090909" strokeWidth="3" strokeLinejoin="round">
              <rect x="300" y="403" width="140" height="25" rx="2" fill="#171717" />
              <rect x="276" y="423" width="188" height="5" rx="1" fill="#171717" />
              <rect x="131" y="512" width="41" height="8" rx="2" fill="#090909" />
              <rect x="568" y="512" width="41" height="8" rx="2" fill="#090909" />
              <rect x="105" y="428" width="530" height="87" rx="7" fill="#171717" />
              <rect x="115" y="20" width="510" height="385" rx="18" fill="#171717" />
            </g>

            {/* The screen remains axis aligned for crisp, accessible HTML text. */}
            <rect x="131" y="46" width="478" height="328" rx="11" fill="#090909" />
            <rect x="145" y="60" width="450" height="300" rx="6" fill="#171717" />

            {/* Small marks on the CRT chin, all flat and deliberately sparse. */}
            <g stroke="#090909" strokeWidth="2.5" strokeLinecap="round">
              <path d="M144 383h42m-42 5h42m-42 5h42" />
              <path d="M494 386h25" />
            </g>
            <rect x="205" y="385" width="6" height="2" rx="1" fill="#aaaaaa" />
            <rect x="218" y="385" width="6" height="2" rx="1" fill="#aaaaaa" />
            <circle cx="568" cy="387" r="2" fill={screenOn ? '#aaaaaa' : '#555555'} />
            <circle cx="590" cy="387" r="6" fill="#aaaaaa" />
            <path d="M590 383.5v3m-2-1c-2.5 2.5-1 5.5 2 5.5s4.5-3 2-5.5" fill="none" stroke="#090909" strokeWidth="1" strokeLinecap="round" />

            {/* Front desktop case with a power key and a simple floppy slot. */}
            <circle cx="172" cy="478" r="2" fill={screenOn ? '#aaaaaa' : '#555555'} />
            <g stroke="#090909" strokeWidth="3" strokeLinecap="round">
              {Array.from({ length: 17 }, (_, index) => (
                <path key={index} d={`M${194 + index * 10} 456v29`} />
              ))}
            </g>
            <rect x="420" y="452" width="188" height="40" rx="3" fill="#171717" stroke="#090909" strokeWidth="2" />
            <rect x="433" y="463" width="162" height="6" rx="1" fill="#090909" />
            <rect x="571" y="480" width="23" height="4" rx="1" fill="#aaaaaa" />
            <rect x="435" y="481" width="4" height="2" rx=".5" fill="#aaaaaa" />
          </svg>

          <button
            ref={screenRef}
            className="archive-computer-screen"
            data-media={Boolean(introMedia.src || introMedia.poster)}
            data-power={screenOn ? 'on' : 'off'}
            disabled={!screenOn}
            type="button"
            onClick={openArchive}
            onPointerEnter={moveReveal}
            onPointerMove={moveReveal}
            onPointerLeave={() => {
              pointerInsideRef.current = false;
              screenRectRef.current = null;
              syncReveal();
            }}
            onPointerCancel={() => {
              pointerInsideRef.current = false;
              screenRectRef.current = null;
              syncReveal();
            }}
            onFocus={(event) => {
              keyboardFocusRef.current = event.currentTarget.matches(':focus-visible');
              syncReveal();
            }}
            onBlur={() => {
              keyboardFocusRef.current = false;
              syncReveal();
            }}
            aria-label="Open the archive"
            style={{
              position: 'absolute',
              left: `${(145 / 740) * 100}%`,
              top: `${(60 / 550) * 100}%`,
              width: `${(450 / 740) * 100}%`,
              height: `${(300 / 550) * 100}%`,
              borderRadius: '6px',
            }}
          >
            {introMedia.poster && <img className="archive-screen-media" src={introMedia.poster} alt="" aria-hidden="true" />}
            {introMedia.src && !reducedMotion && (
              <video
                ref={videoRef}
                className="archive-screen-media"
                src={introMedia.src}
                poster={introMedia.poster ?? undefined}
                muted
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
                aria-hidden="true"
                tabIndex={-1}
                style={{ visibility: playbackFailed ? 'hidden' : 'visible' }}
                onPlaying={() => setPlaybackFailed(false)}
                onError={() => setPlaybackFailed(true)}
              />
            )}
            {/* One video texture; pointer changes only the lightweight shader uniforms. */}
            <canvas ref={canvasRef} className="archive-screen-renderer" width={900} height={600} aria-hidden="true" />
            <span className="archive-screen-eyebrow">{templateProfile.brand} / SELECTED WORK</span>
            <span className="archive-screen-title">
              <span className="archive-screen-title-line">An open</span>
              <span className="archive-screen-title-line">
                <span className="archive-screen-archive">archive</span><span className="archive-screen-dot" aria-hidden="true">_</span>
              </span>
            </span>
            <span className="archive-screen-entry">
              <span className="archive-screen-scroll-hint">KEEP SCROLLING</span>
              <span className="archive-screen-arrow" aria-hidden="true">
                <svg viewBox="0 0 72 42" width="72" height="42" focusable="false">
                  <path d="M5 21h53M42 7l16 14-16 14" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
            {loadingProgress !== null && <span className="archive-frame-loading" role="status" aria-label="Opening the archive"><span><i style={{ transform: `scaleX(${loadingProgress})` }} /></span></span>}
          </button>
          <button
            className="archive-computer-power"
            type="button"
            aria-label="Screen power"
            aria-pressed={screenOn}
            title={screenOn ? 'Turn off the screen' : 'Turn on the screen'}
            onClick={() => setScreenOn(on => !on)}
            style={{ left: `${(141 / 740) * 100}%`, top: `${(469 / 550) * 100}%` }}
          >
            <svg viewBox="0 0 28 30" aria-hidden="true" focusable="false">
              <rect width="28" height="30" rx="3" />
              <path d="M14 7v6m-3-2c-4 4-1 10 3 10s7-6 3-10" fill="none" stroke="#090909" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
