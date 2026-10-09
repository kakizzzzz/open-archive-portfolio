import { sampleCameraSegment, type CameraFrame, type ModuleId } from './timeline';

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface LayoutRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

export interface ResponsiveLayout {
  readonly compact: boolean;
  readonly gutter: number;
  readonly navInset: number;
  readonly headerHeight: number;
  readonly footerHeight: number;
  readonly safeRect: LayoutRect;
  readonly computerWidth: number;
}

export interface DeskLayoutFrame {
  readonly layout: ResponsiveLayout;
  /** Canvas point placed at center; scale is supplied separately in screen units. */
  readonly camera: { readonly x: number; readonly y: number };
  readonly center: { readonly x: number; readonly y: number };
  readonly scale: number;
}

interface PaperGeometry {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
}

// About uses the compact CSS portrait; the other paper rectangles are shared.
const PAPER_GEOMETRY: Readonly<Record<ModuleId, PaperGeometry>> = {
  about: { left: 583, top: 132, width: 410, height: 620, rotation: 0.4 },
  fragments: { left: 32, top: 138, width: 395, height: 390, rotation: -1.4 },
  craft: { left: 1150, top: 138, width: 410, height: 415, rotation: 0.9 },
  perspective: { left: 34, top: 570, width: 394, height: 369, rotation: 0.8 },
  works: { left: 1015, top: 602, width: 547, height: 344, rotation: -0.6 },
  collaboration: { left: 467, top: 777, width: 505, height: 172, rotation: -0.5 },
};

const DESK_WIDTH = 1600;
const DESK_HEIGHT = 1000;
const PAPER_BLEED = 18;
const dimension = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const lerp = (from: number, to: number, blend: number): number => from + (to - from) * blend;

/** One viewport contract shared by chrome, artwork and the physical desk camera. */
export function getResponsiveLayout(viewport: ViewportSize): ResponsiveLayout {
  const width = dimension(viewport.width);
  const height = dimension(viewport.height);
  const compact = width < 700;
  const short = height < 480;
  const gutter = clamp(width * 0.034, 20, 48);
  const navInset = clamp(width * 0.014, 10, 20);
  const headerHeight = short ? 56 : compact ? 72 : 76;
  const footerHeight = short ? 48 : 65;
  const margin = short ? 12 : 24;

  // Empty or not-yet-measured surfaces collapse safely instead of creating negative sizes.
  const left = Math.min(gutter, width / 2);
  const right = Math.max(left, width - Math.max(gutter, navInset + 40));
  const top = Math.min(headerHeight + margin, height / 2);
  const bottom = Math.max(top, height - footerHeight - margin);
  return {
    compact,
    gutter,
    navInset,
    headerHeight,
    footerHeight,
    safeRect: { left, top, right, bottom, width: right - left, height: bottom - top },
    computerWidth: Math.max(0, Math.min(740, width - 2 * gutter, (height - headerHeight - footerHeight - 2 * margin) * 740 / 550)),
  };
}

/** Rotated paper extents, including tape, shadows and the hover outline in canvas units. */
function paperHalfExtents(id: ModuleId, camera: CameraFrame): { x: number; y: number } {
  const paper = PAPER_GEOMETRY[id];
  const angle = paper.rotation * Math.PI / 180;
  const cosine = Math.abs(Math.cos(angle));
  const sine = Math.abs(Math.sin(angle));
  const halfWidth = (paper.width * cosine + paper.height * sine) / 2 + PAPER_BLEED;
  const halfHeight = (paper.height * cosine + paper.width * sine) / 2 + PAPER_BLEED;
  const centerX = paper.left + paper.width / 2;
  const centerY = paper.top + paper.height / 2;
  return { x: halfWidth + Math.abs(centerX - camera.x), y: halfHeight + Math.abs(centerY - camera.y) };
}

function endpointScale(camera: CameraFrame, id: ModuleId | null, safeRect: LayoutRect, compact: boolean): number {
  const boardFit = Math.min(safeRect.width / DESK_WIDTH, safeRect.height / DESK_HEIGHT);
  if (!id || (id === 'about' && !compact)) return boardFit;
  const extent = paperHalfExtents(id, camera);
  const paperFit = Math.min(safeRect.width / (2 * extent.x), safeRect.height / (2 * extent.y));
  if (id === 'about') return paperFit;
  return Math.min(boardFit * camera.scale, paperFit);
}

/** The compact portrait has its own physical center; other timeline points stay intact. */
function endpointCamera(camera: CameraFrame, id: ModuleId | null, compact: boolean): CameraFrame {
  if (compact && id === 'about') return { ...camera, x: 788, y: 442 };
  return camera;
}

/**
 * Pure scene-to-layout mapping. Fit both segment endpoints before interpolation so
 * changing the selected module halfway through a move cannot change camera scale.
 */
export function sampleDeskLayout(sceneProgress: number, viewport: ViewportSize): DeskLayoutFrame {
  const layout = getResponsiveLayout(viewport);
  const segment = sampleCameraSegment(sceneProgress, layout.compact);
  const from = endpointCamera(segment.from, segment.fromModule, layout.compact);
  const to = endpointCamera(segment.to, segment.toModule, layout.compact);
  const fromScale = endpointScale(from, segment.fromModule, layout.safeRect, layout.compact);
  const toScale = endpointScale(to, segment.toModule, layout.safeRect, layout.compact);
  return {
    layout,
    camera: {
      x: lerp(from.x, to.x, segment.blend),
      y: lerp(from.y, to.y, segment.blend),
    },
    center: {
      x: (layout.safeRect.left + layout.safeRect.right) / 2,
      y: (layout.safeRect.top + layout.safeRect.bottom) / 2,
    },
    scale: lerp(fromScale, toScale, segment.blend),
  };
}
