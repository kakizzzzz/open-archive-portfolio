import { useEffect, useRef } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { contactEmail, contactPhone, otherPortfolioUrl, portfolioWorks, reasons } from './content';
import { portfolioModules } from './modules';
import type { ModuleId } from './timeline';
import ResumeDetails from './ResumeDetails';

export type ArchiveDetail =
  | { type: 'module'; id: ModuleId }
  | { type: 'work'; id: string }
  | { type: 'resume' };

type ArchiveDialogProps = {
  detail: ArchiveDetail | null;
  onClose: () => void;
  onView: (id: string) => void;
};

export default function ArchiveDialog({ detail, onClose, onView }: ArchiveDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const module = detail?.type === 'module' ? portfolioModules.find(item => item.id === detail.id) : undefined;
  const workIndex = detail?.type === 'work' ? portfolioWorks.findIndex(work => work.id === detail.id) : -1;
  const work = portfolioWorks[workIndex];
  const selectedReasons = module?.id === 'about' ? reasons : reasons.filter(reason => module?.reasonIds.includes(reason.id));
  const isResume = detail?.type === 'resume';

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (detail && !element.open) element.showModal();
    if (!detail && element.open) element.close();
    element.scrollTop = 0;
  }, [detail]);

  return (
    <dialog
      ref={dialog}
      className={`archive-archive-dialog${isResume ? ' archive-resume-dialog' : ''}${work ? ' archive-image-dialog' : ''}`}
      onClose={onClose}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      aria-labelledby={isResume ? undefined : 'archive-detail-title'}
      aria-label={isResume ? 'Profile' : undefined}
    >
      {detail && <div className="archive-detail-paper">
        <button autoFocus type="button" className="archive-detail-close" onClick={onClose} aria-label="Close details"><X size={20} /></button>
        {isResume ? <ResumeDetails /> : <h2 id="archive-detail-title">{work?.title || module?.label}</h2>}
        {module && selectedReasons.map(reason => <article key={reason.id} className="archive-detail-reason">
          <span>{reason.id}</span><div><h3>{reason.title}</h3><p className={reason.author ? 'archive-poem' : undefined}>{reason.body}</p>{reason.author && <a className="archive-poem-credit" href={reason.source} target="_blank" rel="noopener noreferrer">— {reason.author} <ArrowUpRight size={12} aria-hidden="true" /></a>}</div>
        </article>)}
        {module?.id === 'fragments' && <div className="archive-detail-fragment-images" aria-label="Selected visual fragments">
          {portfolioWorks.filter(item => item.category === 'fragments').map(item => <button
            key={item.id}
            className="archive-detail-fragment-image"
            type="button"
            onClick={() => onView(item.id)}
            aria-label={`View ${item.title}`}
          >
            <img src={item.image} alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async" />
          </button>)}
        </div>}
        {module?.id === 'works' && <div className="archive-detail-works">
          {portfolioWorks.map(item => <article key={item.id}>
            <button className="archive-detail-work-button" type="button" onClick={() => onView(item.id)} aria-label={`View ${item.title}`}>
              <img src={item.thumbnail} alt={item.alt} loading="lazy" decoding="async" />
            </button>
            <h3>{item.title}</h3>
          </article>)}
        </div>}
        {work && <>
          <figure className="archive-lightbox">
            <div className="archive-lightbox-image">
              <img src={work.image} alt={work.alt} width={work.width} height={work.height} decoding="async" />
            </div>
            <figcaption>{work.caption}</figcaption>
          </figure>
          <nav className="archive-lightbox-actions" aria-label="Browse enlarged images">
            <button type="button" disabled={workIndex === 0} onClick={() => onView(portfolioWorks[workIndex - 1].id)}><ChevronLeft size={17} />Previous</button>
            <span>{workIndex + 1} / {portfolioWorks.length}</span>
            <button type="button" disabled={workIndex === portfolioWorks.length - 1} onClick={() => onView(portfolioWorks[workIndex + 1].id)}>Next<ChevronRight size={17} /></button>
          </nav>
        </>}
        {module?.id === 'collaboration' && <div>
          <a className="archive-detail-contact" href={`mailto:${contactEmail}`}>{contactEmail}<ArrowUpRight size={18} /></a>
          <a className="archive-detail-contact" href={`tel:${contactPhone}`}>{contactPhone}<ArrowUpRight size={18} /></a>
        </div>}
        {module?.id === 'works' && <a className="archive-detail-other-works" href={otherPortfolioUrl} target="_blank" rel="noopener noreferrer">Elsewhere<ArrowUpRight size={15} /></a>}
      </div>}
    </dialog>
  );
}
