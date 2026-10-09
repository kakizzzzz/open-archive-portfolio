/** A camera looks at this point in the 1600 × 1000 desk canvas. */
export interface CameraFrame {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export type ModuleId =
  | 'about'
  | 'fragments'
  | 'craft'
  | 'perspective'
  | 'works'
  | 'collaboration';

export const MODULE_FOCUS: Readonly<Record<ModuleId, CameraFrame>> = Object.freeze({
  about: Object.freeze({ x: 800, y: 500, scale: 1 }),
  fragments: Object.freeze({ x: 230, y: 333, scale: 2.3 }),
  craft: Object.freeze({ x: 1355, y: 346, scale: 2.3 }),
  perspective: Object.freeze({ x: 231, y: 755, scale: 2.2 }),
  works: Object.freeze({ x: 1289, y: 774, scale: 2.4 }),
  collaboration: Object.freeze({ x: 720, y: 863, scale: 2.6 }),
});

const COMPACT_ZOOM: Readonly<Record<ModuleId, number>> = Object.freeze({
  about: 1, fragments: 3.5, craft: 3.5, perspective: 3.5, works: 2.8, collaboration: 2.9,
});

export interface TimelineStop {
  readonly t: number;
  readonly camera: CameraFrame;
  readonly activeModule: ModuleId | null;
}

const stop = (t: number, module: ModuleId, activeModule: ModuleId | null = module): TimelineStop =>
  Object.freeze({ t, camera: MODULE_FOCUS[module], activeModule });

/**
 * Repeated camera positions give each module a reading hold before the next move.
 * All coordinates use the desk canvas; the renderer handles viewport sizing.
 */
export const TIMELINE_STOPS: readonly TimelineStop[] = Object.freeze([
  stop(0, 'about', null),
  stop(0.13, 'about'),
  stop(0.18, 'about'),
  stop(0.25, 'fragments'),
  stop(0.32, 'fragments'),
  stop(0.40, 'craft'),
  stop(0.47, 'craft'),
  stop(0.55, 'perspective'),
  stop(0.62, 'perspective'),
  stop(0.70, 'works'),
  stop(0.77, 'works'),
  stop(0.85, 'collaboration'),
  stop(0.92, 'collaboration'),
  stop(1, 'about'),
]);

/** Every animated value in a frame is derived only from normalized progress. */
export interface TimelineFrame {
  readonly camera: CameraFrame;
  readonly computerScale: number;
  readonly computerOpacity: number;
  readonly deskOpacity: number;
  readonly activeModule: ModuleId | null;
  readonly progress: number;
  readonly sceneProgress: number;
  readonly galleryProgress: number;
  readonly galleryOpacity: number;
  readonly galleryExpansion: number;
  readonly galleryContentOpacity: number;
}

// NaN falls back to the opening frame; infinities clamp to the appropriate end.
const clampProgress = (t: number): number => t >= 1 ? 1 : t > 0 ? t : 0;
const smoothstep = (t: number): number => t * t * (3 - 2 * t);
const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;
const phase = (t: number, from: number, to: number): number =>
  smoothstep(clampProgress((t - from) / (to - from)));

const INTRO_END_SCENE = 0.13;
const ARCHIVE_REVEAL_END_SCENE = 0.16;

/** The incoming archive starts only after the computer has fully left. */
export function sampleOpeningLayers(sceneProgress: number, reducedMotion = false) {
  const progress = clampProgress(sceneProgress);
  const computerOpacity = reducedMotion
    ? Number(progress < INTRO_END_SCENE)
    : 1 - phase(progress, 0.08, INTRO_END_SCENE);
  const deskOpacity = reducedMotion
    ? Number(progress >= INTRO_END_SCENE)
    : phase(progress, INTRO_END_SCENE, ARCHIVE_REVEAL_END_SCENE);
  return {
    computerOpacity,
    deskOpacity,
    computerVisible: computerOpacity > 0,
    archiveVisible: deskOpacity > 0,
    computerInteractive: progress < 0.08 && computerOpacity > 0,
    archiveInteractive: deskOpacity >= 1,
  };
}

export interface CameraSegment {
  readonly from: CameraFrame;
  readonly to: CameraFrame;
  readonly fromModule: ModuleId | null;
  readonly toModule: ModuleId | null;
  readonly blend: number;
}

/** Sample the original scene time, before the gallery extends scroll duration. */
export function sampleCameraSegment(sceneProgress: number, compact = false): CameraSegment {
  const progress = clampProgress(sceneProgress);
  let right = 1;
  while (right < TIMELINE_STOPS.length - 1 && progress > TIMELINE_STOPS[right].t) right += 1;

  const from = TIMELINE_STOPS[right - 1];
  const to = TIMELINE_STOPS[right];
  return {
    from: compact ? { ...from.camera, scale: COMPACT_ZOOM[from.activeModule || 'about'] } : from.camera,
    to: compact ? { ...to.camera, scale: COMPACT_ZOOM[to.activeModule || 'about'] } : to.camera,
    fromModule: from.activeModule,
    toModule: to.activeModule,
    blend: phase(progress, from.t, to.t),
  };
}

const BASE_SCROLL_UNITS = 8;
const GALLERY_START_SCENE = 0.74;
const GALLERY_END_SCENE = 0.77;
// The paper expands for 0.32 fixed units before horizontal image travel begins.
const GALLERY_START_UNITS = GALLERY_START_SCENE * BASE_SCROLL_UNITS;
const GALLERY_BASE_HOLD_UNITS = (GALLERY_END_SCENE - GALLERY_START_SCENE) * BASE_SCROLL_UNITS;
const GALLERY_END_UNITS = GALLERY_START_UNITS + GALLERY_BASE_HOLD_UNITS;
const EXTRA_UNITS_PER_IMAGE = 0.65;

const normalizeGalleryCount = (count: number): number =>
  Number.isFinite(count) ? Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(count))) : 1;

const galleryTiming = (count: number) => {
  const normalizedCount = normalizeGalleryCount(count);
  const extra = (normalizedCount - 1) * EXTRA_UNITS_PER_IMAGE;
  return {
    count: normalizedCount,
    extra,
    total: BASE_SCROLL_UNITS + extra,
    hold: GALLERY_BASE_HOLD_UNITS + extra,
  };
};

/** Runway includes the pinned viewport plus all scrollable timeline units. */
export function timelineRunwayVh(count = 1): number {
  return (galleryTiming(count).total + 1) * 100;
}

/** Convert a base camera stop into the extended gallery's scroll progress. */
const progressForCameraStop = (baseProgress: number, count: number): number => {
  const { extra, total } = galleryTiming(count);
  const galleryTravel = clampProgress((baseProgress - GALLERY_START_SCENE) / (GALLERY_END_SCENE - GALLERY_START_SCENE));
  return (baseProgress * BASE_SCROLL_UNITS + galleryTravel * extra) / total;
};

/**
 * Pure scroll-to-frame function: no clock, spring, DOM, or retained state.
 * During a camera move the active module is the nearer timeline endpoint.
 * The computer opening remains unselected until the desk is fully revealed.
 */
export function sampleTimeline(t: number, compact = false, galleryCount = 1): TimelineFrame {
  const progress = clampProgress(t);
  const { extra, total, hold } = galleryTiming(galleryCount);
  const units = progress * total;
  // Stretch only image travel; the paper's entrance and all camera moves keep their lengths.
  const cameraProgress = extra === 0 || progress === 1
    ? progress
    : units < GALLERY_START_UNITS
      ? units / BASE_SCROLL_UNITS
      : units <= GALLERY_END_UNITS + extra
        ? GALLERY_START_SCENE + ((units - GALLERY_START_UNITS) / hold) * (GALLERY_END_SCENE - GALLERY_START_SCENE)
        : (units - extra) / BASE_SCROLL_UNITS;

  const { from, to, fromModule, toModule, blend } = sampleCameraSegment(cameraProgress, compact);
  const opening = sampleOpeningLayers(cameraProgress);

  return {
    camera: {
      x: lerp(from.x, to.x, blend),
      y: lerp(from.y, to.y, blend),
      scale: lerp(from.scale, to.scale, blend),
    },
    computerScale: lerp(1, 5, phase(cameraProgress, 0, 0.13)),
    computerOpacity: opening.computerOpacity,
    deskOpacity: opening.deskOpacity,
    activeModule: cameraProgress < 0.13 ? null : blend < 0.5 ? fromModule : toModule,
    progress,
    sceneProgress: cameraProgress,
    galleryProgress: clampProgress((units - GALLERY_START_UNITS) / hold),
    // The gallery is the card's real content; its visibility follows the desk externally.
    galleryOpacity: 1,
    galleryExpansion: phase(cameraProgress, 0.70, 0.74) * (1 - phase(cameraProgress, 0.77, 0.82)),
    galleryContentOpacity: 1,
  };
}

/** Clicking a module seeks to the first fully focused frame of that module. */
export function progressForModule(id: ModuleId, count = 1): number {
  if (id === 'works') return progressForCameraStop(GALLERY_START_SCENE, count);
  // The entrance and chapter-one buttons must finish the archive reveal,
  // rather than stopping at the frame where both visual layers are transparent.
  if (id === 'about') return progressForCameraStop(ARCHIVE_REVEAL_END_SCENE, count);
  const baseProgress = TIMELINE_STOPS.find(point => point.activeModule === id)?.t ?? 0.13;
  return progressForCameraStop(baseProgress, count);
}

/** Map normalized gallery travel into the horizontal works hold of the scroll timeline. */
export function progressForGalleryProgress(progress: number, count = 1): number {
  const timing = galleryTiming(count);
  return (GALLERY_START_UNITS + clampProgress(progress) * timing.hold) / timing.total;
}

/** Seek directly to a zero-based image index within the horizontal works hold. */
export function progressForGalleryImage(index: number, count: number): number {
  const normalizedCount = normalizeGalleryCount(count);
  const imageProgress = normalizedCount > 1 ? clampProgress(index / (normalizedCount - 1)) : 0;
  return progressForGalleryProgress(imageProgress, count);
}
