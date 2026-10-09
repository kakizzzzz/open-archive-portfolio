import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { otherPortfolioUrl, portfolioWorks } from './content';
import { sampleGalleryLayoutProgress, type GalleryLayout } from './galleryLayout';
import type { GalleryComposition } from './galleryComposition';

type ScrollGalleryProps = {
  layout: GalleryLayout;
  composition: GalleryComposition;
  progress: number;
  reducedMotion?: boolean;
  onView: (id: string) => void;
  onSeek: (index: number) => void;
};

export default function ScrollGallery({ layout, composition, progress, reducedMotion = false, onView, onSeek }: ScrollGalleryProps) {
  const count = portfolioWorks.length;
  const clampedProgress = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const galleryFrame = sampleGalleryLayoutProgress(clampedProgress, layout);
  const index = galleryFrame.currentIndex;
  const position = reducedMotion ? index : clampedProgress * (count - 1);
  const ribbonPosition = reducedMotion ? layout.positions[index] * layout.maxTravel : galleryFrame.position;
  const maxAspectRatio = Math.max(...portfolioWorks.map(work => work.width / work.height));

  return (
    <section className="archive-scroll-gallery" data-ribbon={layout.compact} aria-label="Selected work gallery" style={{
      '--gallery-max-ratio': maxAspectRatio,
      '--gallery-image-height': `${layout.imageHeight}px`,
    } as CSSProperties}>
      <header className="archive-gallery-header">
        <span className="archive-gallery-counter" style={{ transform: `translate3d(${composition.counterOffsetX}px, ${composition.counterOffsetY}px, 0)` }}>
          {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>
      </header>

      <div className="archive-gallery-viewport" style={{ transform: `translate3d(${composition.artOffsetX}px, ${composition.artOffsetY ?? 0}px, 0) scale(${composition.artScale})` }}>
        <div className="archive-gallery-track" style={layout.compact ? {
          transform: `translate3d(${-ribbonPosition}px, 0, 0)`,
          width: layout.trackWidth,
          paddingLeft: layout.leading,
          paddingRight: layout.trailing,
        } : { transform: `translate3d(${-position * 100}%, 0, 0)` }}>
          {portfolioWorks.map((work, workIndex) => (
            <figure className="archive-gallery-slide" key={work.id} style={layout.compact ? { width: layout.widths[workIndex] } : undefined}>
              <div className="archive-gallery-art-area">
                <button
                  className="archive-gallery-art"
                  type="button"
                  onClick={() => onView(work.id)}
                  tabIndex={workIndex === index ? 0 : -1}
                  aria-label={`View ${work.title}`}
                  style={{ aspectRatio: `${work.width} / ${work.height}` }}
                >
                  <img
                    src={work.image}
                    alt={work.alt}
                    width={work.width}
                    height={work.height}
                    loading={workIndex < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </button>
              </div>
              <figcaption className="archive-gallery-caption" style={{ transform: `translate3d(0, ${composition.captionOffsetY}px, 0)` }}>
                <span className="archive-gallery-title">{work.title}</span>
                {work.caption && <span className="archive-gallery-description">{work.caption}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {layout.compact && <div className="archive-gallery-current-caption" style={{ transform: `translate3d(${composition.artOffsetX}px, ${composition.artOffsetY ?? 0}px, 0) scale(${composition.artScale})` }}>
        <span className="archive-gallery-title">{portfolioWorks[index].title}</span>
        {portfolioWorks[index].caption && <span className="archive-gallery-description">{portfolioWorks[index].caption}</span>}
      </div>}

      <footer className="archive-gallery-controls" style={{ transform: `translate3d(0, ${composition.controlsOffsetY}px, 0)` }}>
        <button
          className="archive-gallery-prev"
          type="button"
          onClick={() => onSeek(index - 1)}
          disabled={index === 0}
          aria-label="Previous image"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button
          className="archive-gallery-next"
          type="button"
          onClick={() => onSeek(index + 1)}
          disabled={index === count - 1}
          aria-label="Next image"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <span className="archive-gallery-scroll-hint">KEEP SCROLLING</span>
        <a className="archive-gallery-other-works" href={otherPortfolioUrl} target="_blank" rel="noopener noreferrer">
          Elsewhere <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </footer>
    </section>
  );
}
