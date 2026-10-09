import { useLayoutEffect, useState } from 'react';

export type VisibleViewport = {
  width: number;
  height: number;
  left: number;
  top: number;
};

function readViewport(): VisibleViewport {
  if (typeof window === 'undefined') return { width: 1440, height: 900, left: 0, top: 0 };
  const visual = window.visualViewport;
  const width = document.documentElement.clientWidth || window.innerWidth;
  const height = document.documentElement.clientHeight || window.innerHeight;
  return {
    width: Math.max(1, Math.min(width, visual?.width || width)),
    height: Math.max(1, Math.min(height, visual?.height || height)),
    left: Math.max(0, visual?.offsetLeft || 0),
    top: Math.max(0, visual?.offsetTop || 0),
  };
}

/** Layout follows the visible window; animation still follows only scroll progress. */
export default function useViewport() {
  const [viewport, setViewport] = useState(readViewport);

  useLayoutEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const next = readViewport();
      setViewport(previous => Object.keys(next).every(key =>
        Math.abs(next[key as keyof VisibleViewport] - previous[key as keyof VisibleViewport]) < 0.01
      ) ? previous : next);
    };
    const scheduleMeasure = () => { if (!raf) raf = window.requestAnimationFrame(measure); };
    const visual = window.visualViewport;
    const resize = new ResizeObserver(scheduleMeasure);
    resize.observe(document.documentElement);
    window.addEventListener('resize', scheduleMeasure);
    visual?.addEventListener('resize', scheduleMeasure);
    visual?.addEventListener('scroll', scheduleMeasure);
    measure();
    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      visual?.removeEventListener('resize', scheduleMeasure);
      visual?.removeEventListener('scroll', scheduleMeasure);
      resize.disconnect();
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return viewport;
}
