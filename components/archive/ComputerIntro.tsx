import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { introMedia, templateProfile } from './content';

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
  const revealFrameRef = useRef<number | null>(null);
  const revealPointRef = useRef({ x: 50, y: 50 });
  const pointerInsideRef = useRef(false);
  const keyboardFocusRef = useRef(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);

  const cancelRevealFrame = () => {
    if (revealFrameRef.current !== null) {
      cancelAnimationFrame(revealFrameRef.current);
      revealFrameRef.current = null;
    }
  };

  const paintRevealPoint = () => {
    const screen = screenRef.current;
    if (!screen) return;
    screen.style.setProperty('--screen-pointer-x', `${revealPointRef.current.x}%`);
    screen.style.setProperty('--screen-pointer-y', `${revealPointRef.current.y}%`);
  };

  const syncReveal = () => {
    const screen = screenRef.current;
    if (!screen) return;
    if (!pointerInsideRef.current && keyboardFocusRef.current) {
      cancelRevealFrame();
      revealPointRef.current = { x: 50, y: 50 };
      paintRevealPoint();
    }
    screen.dataset.colorReveal = String(pointerInsideRef.current || keyboardFocusRef.current);
  };

  const moveReveal = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    revealPointRef.current = {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    };
    if (!pointerInsideRef.current) {
      pointerInsideRef.current = true;
      paintRevealPoint();
      syncReveal();
    }
    if (revealFrameRef.current === null) {
      revealFrameRef.current = requestAnimationFrame(() => {
        revealFrameRef.current = null;
        paintRevealPoint();
      });
    }
  };

  useEffect(() => {
    const clearPointerReveal = () => {
      cancelRevealFrame();
      pointerInsideRef.current = false;
      syncReveal();
    };
    const onVisibilityChange = () => {
      if (document.hidden) clearPointerReveal();
    };
    window.addEventListener('blur', clearPointerReveal);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelRevealFrame();
      window.removeEventListener('blur', clearPointerReveal);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // A scroll can hide the screen without sending a pointer-leave event.
    if (!playVideo) {
      cancelRevealFrame();
      pointerInsideRef.current = false;
      keyboardFocusRef.current = false;
      if (screenRef.current) screenRef.current.dataset.colorReveal = 'false';
    }
  }, [playVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let active = true;
    const syncPlayback = () => {
      if (playVideo && !reducedMotion && !document.hidden) {
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
  }, [playVideo, reducedMotion, introMedia.src]);

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
            <circle cx="568" cy="387" r="2" fill="#aaaaaa" />
            <circle cx="590" cy="387" r="6" fill="#aaaaaa" />
            <path d="M590 383.5v3m-2-1c-2.5 2.5-1 5.5 2 5.5s4.5-3 2-5.5" fill="none" stroke="#090909" strokeWidth="1" strokeLinecap="round" />

            {/* Front desktop case with a power key and a simple floppy slot. */}
            <rect x="127" y="454" width="28" height="30" rx="3" fill="#aaaaaa" />
            <path d="M141 461v6m-3-2c-4 4-1 10 3 10s7-6 3-10" fill="none" stroke="#090909" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="172" cy="478" r="2" fill="#aaaaaa" />
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
            type="button"
            onClick={openArchive}
            onPointerEnter={moveReveal}
            onPointerMove={moveReveal}
            onPointerLeave={() => {
              cancelRevealFrame();
              pointerInsideRef.current = false;
              syncReveal();
            }}
            onPointerCancel={() => {
              cancelRevealFrame();
              pointerInsideRef.current = false;
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
            {/* One decoder: the soft masked grayscale veil reveals the color beneath it. */}
            <span className="archive-screen-monochrome-veil" aria-hidden="true" />
            <span className="archive-screen-color-glow" aria-hidden="true" />
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
        </div>
      </div>
    </section>
  );
}
