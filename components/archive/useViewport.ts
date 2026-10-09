import { useLayoutEffect, useState } from 'react';

export type VisibleViewport = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export type ViewportMeasurement = {
  layoutWidth: number;
  layoutHeight: number;
  visualWidth?: number;
  visualHeight?: number;
  visualScale?: number;
  visualLeft?: number;
  visualTop?: number;
};

const positive = (value: number | undefined, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

/** Pinch zoom changes the visible crop, not the responsive layout's device width. */
export function resolveVisibleViewport(measurement: ViewportMeasurement): VisibleViewport {
  const layoutWidth = positive(measurement.layoutWidth, 1);
  const layoutHeight = positive(measurement.layoutHeight, 1);
  const scale = positive(measurement.visualScale, 1);
  const width = Math.max(1, Math.min(layoutWidth,
    positive(positive(measurement.visualWidth, layoutWidth / scale) * scale, layoutWidth)));
  const height = Math.max(1, Math.min(layoutHeight,
    positive(positive(measurement.visualHeight, layoutHeight / scale) * scale, layoutHeight)));
  // At normal scale, keep the visible keyboard/browser-chrome inset. At a pinch
  // scale, the browser already pans the layout; repeating that offset moves the
  // fixed archive a second time and turns a desktop into a miniature phone view.
  const normalScale = Math.abs(scale - 1) < .001;
  const offset = (value: number | undefined, maximum: number): number =>
    normalScale && typeof value === 'number' && Number.isFinite(value)
      ? Math.min(maximum, Math.max(0, value)) : 0;
  return {
    width,
    height,
    left: offset(measurement.visualLeft, Math.max(0, layoutWidth - width)),
    top: offset(measurement.visualTop, Math.max(0, layoutHeight - height)),
  };
}

function readViewport(): VisibleViewport {
  if (typeof window === 'undefined') return { width: 1440, height: 900, left: 0, top: 0 };
  const visual = window.visualViewport;
  const width = document.documentElement.clientWidth || window.innerWidth;
  const height = document.documentElement.clientHeight || window.innerHeight;
  return resolveVisibleViewport({
    layoutWidth: width,
    layoutHeight: height,
    visualWidth: visual?.width,
    visualHeight: visual?.height,
    visualScale: visual?.scale,
    visualLeft: visual?.offsetLeft,
    visualTop: visual?.offsetTop,
  });
}

/** Layout follows the unzoomed visible window; animation follows only scroll progress. */
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
