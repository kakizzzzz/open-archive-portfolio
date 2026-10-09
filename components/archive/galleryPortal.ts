import type { DeskLayoutFrame, ViewportSize } from './layout';

/** The physical paper rectangle in the shared 1600 × 1000 desk canvas. */
export const GALLERY_SOURCE_PAPER = Object.freeze({
  left: 1015,
  top: 602,
  width: 547,
  height: 344,
  rotation: -0.6,
});

export interface GalleryPortalFrame {
  readonly translateX: number;
  readonly translateY: number;
  readonly rotation: number;
  /** Uniform scale for the one viewport-sized gallery content layer. */
  readonly scale: number;
  readonly clipPath: string;
  /** Shared center and scaled content bounds, in viewport pixels. */
  readonly centerX: number;
  readonly centerY: number;
  readonly width: number;
  readonly height: number;
  /** Uniform scale for a separate 547 × 344 paper backdrop. */
  readonly paperScale: number;
  readonly paperWidth: number;
  readonly paperHeight: number;
}

const dimension = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
const coordinate = (value: number): number => Number.isFinite(value) ? value : 0;
const clampProgress = (value: number): number => value >= 1 ? 1 : value > 0 ? value : 0;
const lerp = (from: number, to: number, progress: number): number =>
  progress <= 0 ? from : progress >= 1 ? to : from + (to - from) * progress;

/**
 * Project the works paper through the desk camera. Its backdrop grows uniformly
 * until it covers the viewport; the same viewport-sized gallery content grows
 * uniformly from a contained miniature to scale 1. Only surplus blank paper is
 * clipped by the root viewport, so the visible content never changes or fades.
 * Render both layers around centerX/Y, with the shared rotation and their own
 * uniform scales. Width/height describe content, paperWidth/Height the backdrop.
 *
 * Expansion is already eased by the pure timeline. This function introduces no
 * clock, extra easing, viewport offset, or retained state.
 */
export function sampleGalleryPortal(
  viewport: ViewportSize,
  desk: DeskLayoutFrame,
  expansion: number,
): GalleryPortalFrame {
  const viewportWidth = dimension(viewport.width);
  const viewportHeight = dimension(viewport.height);
  const progress = clampProgress(expansion);
  const deskScale = dimension(desk.scale);
  const sourceCenterX = coordinate(desk.center.x)
    + (GALLERY_SOURCE_PAPER.left + GALLERY_SOURCE_PAPER.width / 2 - coordinate(desk.camera.x)) * deskScale;
  const sourceCenterY = coordinate(desk.center.y)
    + (GALLERY_SOURCE_PAPER.top + GALLERY_SOURCE_PAPER.height / 2 - coordinate(desk.camera.y)) * deskScale;

  const centerX = lerp(sourceCenterX, viewportWidth / 2, progress);
  const centerY = lerp(sourceCenterY, viewportHeight / 2, progress);
  const measurable = viewportWidth > 0 && viewportHeight > 0;
  const containedScale = measurable
    ? Math.min(GALLERY_SOURCE_PAPER.width * deskScale / viewportWidth, GALLERY_SOURCE_PAPER.height * deskScale / viewportHeight)
    : 0;
  const coveringPaperScale = Math.max(viewportWidth / GALLERY_SOURCE_PAPER.width, viewportHeight / GALLERY_SOURCE_PAPER.height);
  const scale = measurable ? lerp(containedScale, 1, progress) : 0;
  const paperScale = lerp(deskScale, coveringPaperScale, progress);

  return {
    translateX: centerX - viewportWidth / 2,
    translateY: centerY - viewportHeight / 2,
    rotation: lerp(GALLERY_SOURCE_PAPER.rotation, 0, progress),
    scale,
    clipPath: 'none',
    centerX,
    centerY,
    width: viewportWidth * scale,
    height: viewportHeight * scale,
    paperScale,
    paperWidth: GALLERY_SOURCE_PAPER.width * paperScale,
    paperHeight: GALLERY_SOURCE_PAPER.height * paperScale,
  };
}
