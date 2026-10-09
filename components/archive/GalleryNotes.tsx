import type { CSSProperties } from 'react';
import type { GalleryNotesLayout } from './galleryNotesLayout';

export default function GalleryNotes({ layout }: { layout: GalleryNotesLayout }) {
  if (layout.level === 'hidden') return null;
  const rectStyle = (rect: GalleryNotesLayout['left']): CSSProperties => ({
    left: rect.left, top: rect.top, width: rect.width, height: rect.height,
    '--note-width': `${rect.width}px`,
  } as CSSProperties);
  const screenHeight = layout.left.height / layout.fontUnit;
  const tight = screenHeight < 320;
  const headingSize = Math.min(layout.headingSize,
    layout.level === 'full' && tight ? 30 : layout.level === 'compact' && screenHeight < 160 ? 22 : layout.headingSize,
  );

  return (
    <div className="archive-gallery-notes" data-density={layout.level} data-tight={tight} aria-hidden="true" style={{
      opacity: layout.opacity,
      '--note-unit': layout.fontUnit,
      '--note-heading': `${headingSize}px`,
    } as CSSProperties}>
      <div className="archive-gallery-note archive-gallery-note-left" style={rectStyle(layout.left)}>
        <span className="archive-gallery-note-label">{layout.level === 'minimal' ? '05' : 'ARCHIVE / 05'}</span>
        <h2>{layout.level === 'minimal' ? 'Work.' : <>Selected<br /><em>work.</em></>}</h2>
        {layout.level === 'full' && <div className="archive-gallery-note-copy">
          <p>An open collection of images, observations, and ideas in progress. Each piece begins with something small: a shape, a feeling, or a passing thought.</p>
          <p>Gathered here to be seen a little closer — and to make room for whatever comes next.</p>
        </div>}
        {layout.level === 'compact' && <p className="archive-gallery-note-copy">Images and ideas,<br />always in progress.</p>}
        {layout.level === 'full' && <span className="archive-gallery-note-foot">LOOK A LITTLE CLOSER ↗</span>}
      </div>
    </div>
  );
}
