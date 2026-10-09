import { getResponsiveLayout, type ViewportSize } from './layout';

export interface GalleryWorkDimensions {
  readonly width: number;
  readonly height: number;
}

export interface GalleryLayout {
  readonly compact: boolean;
  readonly viewportWidth: number;
  readonly imageHeight: number;
  /** Compact image widths; desktop widths remain one complete gallery viewport. */
  readonly widths: readonly number[];
  readonly leading: number;
  readonly trailing: number;
  readonly trackWidth: number;
  readonly maxTravel: number;
  /** Normalized travel required to place each image center in the viewport. */
  readonly positions: readonly number[];
}

export interface GalleryLayoutProgress {
  /** Compact ribbon translation in pixels; desktop uses its existing slide transform. */
  readonly position: number;
  readonly currentIndex: number;
}

const dimension = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
const clampProgress = (value: number): number => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const ratioForWork = (work: GalleryWorkDimensions): number => {
  const ratio = work.width / work.height;
  return Number.isFinite(work.width) && Number.isFinite(work.height) && work.width > 0 && work.height > 0 && Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
};

/** Equal image height with natural widths on compact screens; regular slides on desktop. */
export function getGalleryLayout(viewport: ViewportSize, works: readonly GalleryWorkDimensions[]): GalleryLayout {
  const width = dimension(viewport.width);
  const height = dimension(viewport.height);
  const responsive = getResponsiveLayout({ width, height });
  const { compact, gutter, navInset, headerHeight, footerHeight } = responsive;
  const short = height < 480;
  const viewportWidth = Math.max(0, width - gutter - (navInset + 40));
  const availableHeight = Math.max(0,
    height - headerHeight - footerHeight
    - (short ? 16 : compact ? 31 : 36)
    - (short ? 24 : 36)
    - 39
    - (short ? 8 : compact ? 0 : 18)
    - (short ? 30 : compact ? 52 : 44),
  );
  const count = works.length;
  const imageHeight = count === 0 ? 0 : compact
    ? Math.min(availableHeight, viewportWidth / ratioForWork(works[0]))
    : availableHeight;

  if (!compact) {
    // Each slide stays 100% wide; its existing 18px side padding leaves viewportWidth - 36 for artwork.
    const widths = works.map(() => viewportWidth);
    return {
      compact, viewportWidth, imageHeight, widths,
      leading: 0, trailing: 0,
      trackWidth: dimension(viewportWidth * count),
      maxTravel: dimension(viewportWidth * Math.max(0, count - 1)),
      positions: works.map((_, index) => count > 1 ? index / (count - 1) : 0),
    };
  }

  const widths = works.map(work => dimension(imageHeight * ratioForWork(work)));
  const leading = count > 0 ? Math.max(0, (viewportWidth - widths[0]) / 2) : 0;
  const trailing = count > 0 ? Math.max(0, (viewportWidth - widths[count - 1]) / 2) : 0;
  const gap = 16;
  const trackWidth = count > 0 ? dimension(leading + widths.reduce((sum, item) => sum + item, 0) + gap * (count - 1) + trailing) : 0;
  const maxTravel = Math.max(0, trackWidth - viewportWidth);
  let before = leading;
  const positions = widths.map((item, index) => {
    const center = before + item / 2;
    before += item + gap;
    if (index === 0 || maxTravel === 0) return 0;
    if (index === count - 1) return 1;
    return clampProgress((center - viewportWidth / 2) / maxTravel);
  });
  return { compact, viewportWidth, imageHeight, widths, leading, trailing, trackWidth, maxTravel, positions };
}

/** Only normalized scroll progress determines ribbon translation and its nearest image. */
export function sampleGalleryLayoutProgress(progress: number, layout: GalleryLayout): GalleryLayoutProgress {
  const normalized = clampProgress(progress);
  const count = layout.positions.length;
  if (count === 0) return { position: 0, currentIndex: 0 };
  if (!layout.compact) return { position: 0, currentIndex: Math.round(normalized * (count - 1)) };

  let currentIndex = 0;
  let nearest = Infinity;
  layout.positions.forEach((point, index) => {
    const distance = Math.abs(normalized - clampProgress(point));
    // Select the later image at an exact midpoint, consistent with regular slide rounding.
    if (distance <= nearest) { nearest = distance; currentIndex = index; }
  });
  return { position: count > 1 ? normalized * dimension(layout.maxTravel) : 0, currentIndex };
}
