import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import ComputerIntro from './ComputerIntro';
import IntroChrome from './IntroChrome';
import ArchiveDesk from './ArchiveDesk';
import ArchiveDialog, { type ArchiveDetail } from './ArchiveDialog';
import ScrollGallery from './ScrollGallery';
import GalleryNotes from './GalleryNotes';
import { sampleTimeline, progressForModule, progressForGalleryProgress, timelineRunwayVh, TIMELINE_STOPS, type ModuleId } from './timeline';
import { portfolioWorks, templateProfile } from './content';
import { portfolioModules as modules } from './modules';
import { getResponsiveLayout, sampleDeskLayout } from './layout';
import { getGalleryLayout, sampleGalleryLayoutProgress } from './galleryLayout';
import { GALLERY_SOURCE_PAPER, sampleGalleryPortal } from './galleryPortal';
import { getGalleryComposition } from './galleryComposition';
import { getGalleryNotesLayout } from './galleryNotesLayout';
import useViewport from './useViewport';
import './archive.css';

export default function PortfolioTemplate() {
  const reducedMotion = useReducedMotion();
  const track = useRef<HTMLElement>(null);
  const scrollProgress = useRef(0);
  const [t, setT] = useState(0);
  const viewport = useViewport();
  const [detail, setDetail] = useState<ArchiveDetail | null>(null);
  const isDetailOpen = detail !== null;
  const galleryCount = portfolioWorks.length;
  const layout = getResponsiveLayout(viewport);
  const frame = sampleTimeline(t, layout.compact, galleryCount);
  const gallery = getGalleryLayout(viewport, portfolioWorks);
  const galleryFrame = sampleGalleryLayoutProgress(frame.galleryProgress, gallery);
  const sceneT = frame.sceneProgress;
  const current = modules.find(item => item.id === frame.activeModule);
  const deskScene = reducedMotion && current
    ? TIMELINE_STOPS.find(stop => stop.activeModule === current.id)?.t ?? sceneT
    : sceneT;
  const desk = sampleDeskLayout(deskScene, viewport);
  const { scale, camera } = desk;
  const galleryNotesFocusScale = sampleDeskLayout(0.70, viewport).scale;
  const expansion = reducedMotion ? Number(frame.galleryExpansion >= 0.5) : frame.galleryExpansion;
  const portal = sampleGalleryPortal(viewport, desk, expansion);
  const maxAspectRatio = Math.max(...portfolioWorks.map(work => work.width / work.height));
  const galleryComposition = getGalleryComposition(viewport, expansion, {
    gallery,
    maxAspectRatio,
    deskScale: desk.scale,
    currentImageRatio: portfolioWorks[galleryFrame.currentIndex].width / portfolioWorks[galleryFrame.currentIndex].height,
  });
  const galleryNotes = getGalleryNotesLayout(viewport, expansion, {
    composition: galleryComposition,
    focusScale: galleryNotesFocusScale,
  });
  const card = sampleGalleryPortal(viewport, desk, 0);
  const zoomThroughCard = !reducedMotion && expansion > 0;
  const cardZoom = card.paperScale > 0
    ? portal.paperScale / card.paperScale
    : 1;
  const zoomScale = scale * cardZoom;
  const cardAnchorX = scale > 0 ? camera.x + (card.centerX - desk.center.x) / scale : camera.x;
  const cardAnchorY = scale > 0 ? camera.y + (card.centerY - desk.center.y) / scale : camera.y;
  const galleryInteractive = expansion >= 1 - 1e-6;
  const chromeGray = Math.round(243 + 12 * expansion);

  useEffect(() => {
    const title = document.title;
    const lang = document.documentElement.lang;
    document.title = `${templateProfile.pageTitle} — Portfolio Template`;
    document.documentElement.lang = 'en';
    document.body.classList.add('archive-page-open');
    return () => { document.title = title; document.documentElement.lang = lang; document.body.classList.remove('archive-page-open'); };
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!isDetailOpen || !element) return;
    const savedTop = element.scrollTop;
    const length = element.scrollHeight - element.clientHeight;
    const savedProgress = length > 0 ? savedTop / length : 0;
    scrollProgress.current = savedProgress;
    setT(savedProgress);
    const previousOverflow = element.style.overflowY;
    element.scrollTo({ top: savedTop, left: 0, behavior: 'instant' });
    element.style.overflowY = 'hidden';
    return () => {
      element.style.overflowY = previousOverflow;
      scrollProgress.current = savedProgress;
      setT(savedProgress);
      element.scrollTo({ top: savedProgress * (element.scrollHeight - element.clientHeight), left: 0, behavior: 'instant' });
    };
  }, [isDetailOpen]);

  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    let raf = 0;
    const readProgress = () => {
      const length = element.scrollHeight - element.clientHeight;
      scrollProgress.current = length > 0 ? Math.min(1, Math.max(0, element.scrollTop / length)) : 0;
    };
    const onScroll = () => {
      readProgress();
      if (!raf) raf = window.requestAnimationFrame(() => { raf = 0; setT(scrollProgress.current); });
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    readProgress();
    setT(scrollProgress.current);
    return () => { element.removeEventListener('scroll', onScroll); window.cancelAnimationFrame(raf); };
  }, []);

  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    element.scrollTo({ top: scrollProgress.current * (element.scrollHeight - element.clientHeight), left: 0, behavior: 'instant' });
  }, [viewport.width, viewport.height, galleryCount]);

  const seek = (progress: number) => {
    const element = track.current;
    if (!element) return;
    element.scrollTo({ top: Math.max(0, Math.min(1, progress)) * (element.scrollHeight - element.clientHeight), left: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
  };

  const openModule = (id: ModuleId) => {
    if (id === 'works') seek(progressForModule(id, galleryCount));
    else setDetail({ type: 'module', id });
  };
  const openWork = (id: string) => setDetail({ type: 'work', id });
  const seekImage = (index: number) => seek(progressForGalleryProgress(gallery.positions[Math.max(0, Math.min(galleryCount - 1, index))], galleryCount));
  const hasGalleryNext = current?.id === 'works' && frame.galleryProgress < 1;
  const next = () => {
    if (hasGalleryNext) seekImage(Math.min(galleryCount - 1, galleryFrame.currentIndex + 1));
    else {
      const index = modules.findIndex(item => item.id === current?.id);
      seek(progressForModule(modules[(index + 1) % modules.length].id, galleryCount));
    }
  };

  return (
    <div className="archive-page" data-short={viewport.height < 480} style={{
      left: viewport.left,
      top: viewport.top,
      width: viewport.width,
      height: viewport.height,
      '--viewport-left': `${viewport.left}px`,
      '--viewport-top': `${viewport.top}px`,
      '--viewport-width': `${viewport.width}px`,
      '--viewport-height': `${viewport.height}px`,
      '--page-gutter': `${layout.gutter}px`,
      '--nav-inset': `${layout.navInset}px`,
      '--header-height': `${layout.headerHeight}px`,
      '--footer-height': `${layout.footerHeight}px`,
    } as CSSProperties}>
      <main ref={track} className="archive-scroll-track" tabIndex={0} aria-label="Portfolio archive. Scroll to explore, select a note to read more.">
        <div className="archive-scroll-runway" style={{ height: timelineRunwayVh(galleryCount) / 100 * viewport.height }}>
          <div className="archive-pinned-stage" data-progress={t}>
            <div className="archive-computer-layer" style={{ opacity: reducedMotion ? sceneT < 0.1 ? 1 : 0 : frame.computerOpacity, pointerEvents: sceneT < 0.08 ? 'auto' : 'none', visibility: sceneT >= 0.13 ? 'hidden' : 'visible' }} aria-hidden={sceneT >= 0.13} inert={sceneT >= 0.08}>
              <ComputerIntro width={layout.computerWidth} scale={reducedMotion ? 1 : frame.computerScale} loadingProgress={sceneT > 0.01 && sceneT < 0.12 ? Math.min(1, sceneT / 0.12) : null} onEnter={() => seek(progressForModule('about', galleryCount))} />
            </div>
            <div className="archive-intro-chrome" style={{ opacity: reducedMotion ? sceneT < 0.1 ? 1 : 0 : frame.computerOpacity, visibility: sceneT >= 0.13 ? 'hidden' : 'visible' }} aria-hidden={sceneT >= 0.13} inert={sceneT >= 0.08}>
              <IntroChrome onOpen={() => seek(progressForModule('about', galleryCount))} />
            </div>
            <div className="archive-desk-layer" style={{ opacity: reducedMotion ? sceneT >= 0.1 ? 1 : 0 : frame.deskOpacity, pointerEvents: sceneT >= 0.12 && !galleryInteractive ? 'auto' : 'none' }} aria-hidden={sceneT < 0.12 || galleryInteractive} inert={sceneT < 0.12 || galleryInteractive}>
              <div className="archive-desk-camera" style={{
                left: zoomThroughCard ? portal.centerX : desk.center.x,
                top: zoomThroughCard ? portal.centerY : desk.center.y,
                transform: zoomThroughCard
                  ? `rotate(${portal.rotation - card.rotation}deg) translate3d(${-cardAnchorX * zoomScale}px, ${-cardAnchorY * zoomScale}px, 0) scale(${zoomScale})`
                  : `translate3d(${-camera.x * scale}px, ${-camera.y * scale}px, 0) scale(${scale})`,
              }}>
                <ArchiveDesk onSelect={openModule} onResume={() => setDetail({ type: 'resume' })} />
              </div>
            </div>
            <div className="archive-gallery-layer" data-expansion={frame.galleryExpansion} style={{
              opacity: reducedMotion ? Number(sceneT >= 0.1) : frame.deskOpacity,
              visibility: sceneT >= 0.1 ? 'visible' : 'hidden',
            }} aria-hidden={sceneT < 0.12} inert={sceneT < 0.12}>
              <button className="archive-gallery-paper" data-module="works" type="button" onClick={() => seek(progressForModule('works', galleryCount))} aria-label={`Open chapter 05: ${galleryCount} selected images`} aria-hidden={galleryInteractive} inert={galleryInteractive} tabIndex={galleryInteractive ? -1 : 0} style={{
                left: portal.centerX,
                top: portal.centerY,
                width: GALLERY_SOURCE_PAPER.width,
                height: GALLERY_SOURCE_PAPER.height,
                transform: `translate(-50%, -50%) rotate(${portal.rotation}deg) scale(${portal.paperScale})`,
                pointerEvents: galleryInteractive ? 'none' : 'auto',
              }} />
              <div className="archive-gallery-notes-paper" style={{
                left: portal.centerX,
                top: portal.centerY,
                width: GALLERY_SOURCE_PAPER.width,
                height: GALLERY_SOURCE_PAPER.height,
                transform: `translate(-50%, -50%) rotate(${portal.rotation}deg) scale(${portal.paperScale})`,
              }}>
                <GalleryNotes layout={galleryNotes} />
              </div>
              <div className="archive-gallery-content" aria-hidden={!galleryInteractive} inert={!galleryInteractive} style={{
                left: portal.centerX,
                top: portal.centerY,
                width: viewport.width,
                height: viewport.height,
                transform: `translate(-50%, -50%) rotate(${portal.rotation}deg) scale(${portal.scale})`,
                pointerEvents: galleryInteractive ? 'auto' : 'none',
              }}>
                <ScrollGallery layout={gallery} composition={galleryComposition} progress={frame.galleryProgress} reducedMotion={!!reducedMotion} onView={openWork} onSeek={seekImage} />
              </div>
            </div>
            <div className="archive-archive-chrome" style={{ opacity: frame.deskOpacity, '--chrome-surface': `rgb(${chromeGray}, ${chromeGray}, ${chromeGray})` } as CSSProperties} aria-hidden={sceneT < 0.12} inert={sceneT < 0.12}>
              <header><button type="button" onClick={() => seek(0)}>{templateProfile.brand}<span> / ARCHIVE</span></button><button type="button" onClick={() => openModule('collaboration')}>Say hello <ArrowUpRight size={13} /></button></header>
              <nav className="archive-focus-nav" aria-label="Archive sections">{modules.map((item, index) => <button key={item.id} type="button" onClick={() => seek(progressForModule(item.id, galleryCount))} aria-current={current?.id === item.id ? 'location' : undefined} aria-label={`Explore ${item.label}`}>{index + 1}</button>)}</nav>
              <footer><span>{current ? current.label : 'Overview'}</span><button type="button" onClick={next}>{hasGalleryNext ? 'Next image' : 'Next chapter'} <ArrowDown size={12} /></button><span className="archive-t-readout">{String(modules.findIndex(item => item.id === current?.id) + 1).padStart(2, '0')} / 06</span></footer>
            </div>
          </div>
        </div>
      </main>
      <ArchiveDialog detail={detail} onClose={() => setDetail(null)} onView={openWork} />
    </div>
  );
}
