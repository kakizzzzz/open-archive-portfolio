import { GALLERY_SOURCE_PAPER } from './galleryPortal';
import type { GalleryLayout } from './galleryLayout';
import { getResponsiveLayout, type LayoutRect, type ViewportSize } from './layout';

export interface GalleryCompositionOptions {
  readonly gallery: GalleryLayout;
  readonly maxAspectRatio: number;
  /** The current pure-t desk camera scale, including the reverse exit. */
  readonly deskScale: number;
  /** The visible work's ratio; invalid values use the collection maximum. */
  readonly currentImageRatio: number;
}

export interface GalleryComposition {
  /** Applied in native viewport pixels before the portal's uniform content scale. */
  readonly artOffsetX: number;
  readonly artOffsetY: number;
  readonly artScale: number;
  /** Inner caption translation, before its parent row's uniform scale. */
  readonly captionOffsetY: number;
  readonly counterOffsetX: number;
  readonly counterOffsetY: number;
  readonly controlsOffsetY: number;
  readonly textRect: LayoutRect;
  readonly textOpacity: number;
  readonly motionProgress: number;
  /** The native gallery viewport's center, matching CSS transform-origin:center. */
  readonly artOriginX: number;
  readonly artOriginY: number;
  readonly previewScale: number;
  readonly coverScale: number;
  readonly nativeRowTop: number;
  readonly nativeRowHeight: number;
  readonly nativeImageHeight: number;
}

const TEXT_RECT: LayoutRect = Object.freeze({ left: 24, top: 40, right: 229, bottom: 304, width: 205, height: 264 });
const ART_SLOT = Object.freeze({ left: 253, right: 523, width: 270, height: 272, centerX: 388 });
const PREVIEW = Object.freeze({ imageHeight: 260, imageCenterY: 164, imageTop: 36, counterY: 22, controlsY: 325, captionGap: 8 });
const dimension = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
const clampProgress = (value: number): number => value >= 1 ? 1 : value > 0 ? value : 0;
const smoothstep = (value: number): number => value * value * (3 - 2 * value);
const phase = (value: number, from: number, to: number): number => smoothstep(clampProgress((value - from) / (to - from)));
const lerp = (from: number, to: number, progress: number): number =>
  progress <= 0 ? from : progress >= 1 ? to : from + (to - from) * progress;

/**
 * One artwork row moves from the paper's right column into its existing centered
 * gallery pose. It never changes DOM or image. The collection's maximum ratio
 * still sets the common fullscreen image height. Desktop previews fit the
 * painted image and its caption to the paper, instead of fitting an entire
 * mostly empty native row. Caption and chrome follow those same endpoint poses;
 * their ink gaps remain positive throughout the interpolation. Compact ribbons
 * keep their whole-viewport fit. All values depend only on inputs.
 */
export function getGalleryComposition(
  viewport: ViewportSize,
  expansion: number,
  options: GalleryCompositionOptions,
): GalleryComposition {
  const width = dimension(viewport.width);
  const height = dimension(viewport.height);
  const responsive = getResponsiveLayout({ width, height });
  const { gallery } = options;
  const compact = gallery.compact;
  const short = height < 480;
  const galleryWidth = dimension(gallery.viewportWidth);
  const imageHeight = dimension(gallery.imageHeight);
  const validRatio = Number.isFinite(options.maxAspectRatio) && options.maxAspectRatio > 0;
  const maxRatio = validRatio ? options.maxAspectRatio : 1;
  const currentRatio = Number.isFinite(options.currentImageRatio) && options.currentImageRatio > 0
    ? options.currentImageRatio : maxRatio;
  const measurable = width > 0 && height > 0 && galleryWidth > 0 && imageHeight > 0 && validRatio;
  const coverScale = width > 0 && height > 0
    ? Math.max(width / GALLERY_SOURCE_PAPER.width, height / GALLERY_SOURCE_PAPER.height)
    : 0;
  const renderedHeight = compact ? imageHeight : Math.min(imageHeight, Math.max(0, galleryWidth - 36) / maxRatio);
  const nativeRowTop = responsive.headerHeight + (short ? 8 : compact ? 15 : 18) + (short ? 24 : 36);
  const nativeRowHeight = compact
    ? Math.max(0, height - responsive.headerHeight - responsive.footerHeight
      - (short ? 16 : 31) - (short ? 24 : 36) - 39 - (short ? 30 : 52))
    : imageHeight + (short ? 30 + 8 : 44 + 18);
  const artOriginX = responsive.gutter + galleryWidth / 2;
  const artOriginY = nativeRowTop + nativeRowHeight / 2;
  const localCenterX = coverScale > 0
    ? GALLERY_SOURCE_PAPER.width / 2 + (artOriginX - width / 2) / coverScale
    : GALLERY_SOURCE_PAPER.width / 2;
  const collectionArtWidth = compact ? galleryWidth : renderedHeight * maxRatio;
  const previousPreviewScale = measurable
    ? Math.min(1, ART_SLOT.width * coverScale / collectionArtWidth, ART_SLOT.height * coverScale / nativeRowHeight)
    : 1;
  const imageCenterY = compact ? artOriginY : nativeRowTop + (short ? 4 : 8) + imageHeight / 2;
  const captionTop = nativeRowTop + (short ? 4 : 8) + imageHeight;
  const captionCenterY = captionTop + (short ? 17.5 : 27.5);
  // A conservative glyph block for the single-line desktop caption. The flex
  // row's transparent 44px cell does not need to consume miniature paper space.
  const captionInkHeight = short ? 18 : 20;
  const footerTop = nativeRowTop + nativeRowHeight;
  const controlsCenterY = footerTop + 7 + 16;
  const counterCenterY = responsive.headerHeight + (short ? 8 : compact ? 15 : 18) + (short ? 9 : 12);
  const previewTop = Math.max(PREVIEW.imageTop, PREVIEW.counterY + 8 / Math.max(1, coverScale) + 10);
  const previewControlsTop = PREVIEW.controlsY - 16 / Math.max(1, coverScale);
  // Caption height grows with the same uniform scale as the image. Fit that
  // real ink, an 8px caption gap and 6px footer gap, including short screens.
  const captionFit = Math.max(0, (previewControlsTop - 6 - PREVIEW.imageCenterY - PREVIEW.captionGap)
    / (.5 + captionInkHeight / Math.max(1, renderedHeight)));
  const previewImageHeight = Math.max(0, Math.min(PREVIEW.imageHeight,
    ART_SLOT.width / currentRatio,
    2 * (PREVIEW.imageCenterY - previewTop),
    captionFit));
  const previewScale = measurable && !compact
    ? previewImageHeight * coverScale / renderedHeight
    : previousPreviewScale;
  const visibleArtWidth = compact ? galleryWidth : renderedHeight * currentRatio;
  const normalized = clampProgress(expansion);
  const motionProgress = compact ? phase(normalized, .08, .60) : smoothstep(normalized);
  const previewContentScale = coverScale > 0 ? dimension(options.deskScale) / coverScale : 0;
  const contentScale = lerp(previewContentScale, 1, normalized);
  // Interpolate the actual visible image size first. Dividing by the parent
  // portal scale avoids an enlarged miniature growing, shrinking, then growing
  // again while the paper opens. The same row remains uniformly scaled.
  const artScale = !compact && measurable && contentScale > 0
    ? lerp(previewScale * previewContentScale, 1, motionProgress) / contentScale
    : lerp(previewScale, 1, motionProgress);
  const desktopPose = measurable && !compact && contentScale > 0 && motionProgress < 1;
  const nativeFromEndpoints = (previewCenter: number, fullCenter: number, viewportCenter: number) =>
    viewportCenter + lerp((previewCenter - viewportCenter) * previewContentScale, fullCenter - viewportCenter, motionProgress) / contentScale;
  const previewImageCenterX = width / 2 + (ART_SLOT.centerX - GALLERY_SOURCE_PAPER.width / 2) * coverScale;
  const artOffsetX = desktopPose
    ? nativeFromEndpoints(previewImageCenterX, artOriginX, width / 2) - artOriginX
    : compact && measurable ? lerp((ART_SLOT.centerX - localCenterX) * coverScale, 0, motionProgress) : 0;
  const previewImageCenterY = height / 2 + (PREVIEW.imageCenterY - GALLERY_SOURCE_PAPER.height / 2) * coverScale;
  const artOffsetY = desktopPose
    ? nativeFromEndpoints(previewImageCenterY, imageCenterY, height / 2)
      - (artOriginY + (imageCenterY - artOriginY) * artScale)
    : 0;
  const previewCaptionCenterY = previewImageCenterY + previewImageHeight * coverScale / 2
    + PREVIEW.captionGap * coverScale + captionInkHeight * previewScale / 2;
  const captionOffsetY = desktopPose && artScale > 0
    ? (nativeFromEndpoints(previewCaptionCenterY, captionCenterY, height / 2)
      - artOriginY - (captionCenterY - artOriginY) * artScale - artOffsetY) / artScale
    : 0;
  const counterOffsetX = desktopPose
    ? nativeFromEndpoints(previewImageCenterX, width / 2, width / 2) - width / 2
    : compact ? artOffsetX : 0;
  const counterOffsetY = desktopPose
    ? nativeFromEndpoints(height / 2 + (PREVIEW.counterY - GALLERY_SOURCE_PAPER.height / 2) * coverScale, counterCenterY, height / 2) - counterCenterY
    : 0;
  const controlsOffsetY = desktopPose
    ? nativeFromEndpoints(height / 2 + (PREVIEW.controlsY - GALLERY_SOURCE_PAPER.height / 2) * coverScale, controlsCenterY, height / 2) - controlsCenterY
    : 0;
  const localArtLeft = coverScale > 0
    ? GALLERY_SOURCE_PAPER.width / 2 + (artOriginX + artOffsetX - width / 2 - visibleArtWidth * artScale / 2) / coverScale
    : TEXT_RECT.right;
  const safeTextOpacity = smoothstep(clampProgress((localArtLeft - TEXT_RECT.right) / 12));
  const textOpacity = measurable ? (1 - phase(clampProgress(expansion), 0, .16)) * safeTextOpacity : 0;

  return {
    artOffsetX,
    artOffsetY,
    artScale,
    captionOffsetY,
    counterOffsetX,
    counterOffsetY,
    controlsOffsetY,
    textRect: TEXT_RECT,
    textOpacity,
    motionProgress,
    artOriginX,
    artOriginY,
    previewScale,
    coverScale,
    nativeRowTop,
    nativeRowHeight,
    nativeImageHeight: renderedHeight,
  };
}
