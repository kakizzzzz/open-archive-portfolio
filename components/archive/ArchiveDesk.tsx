import React from 'react';
import { ArrowUpRight, Circle, Box, Pencil } from 'lucide-react';
import { contactEmail, contactPhone, templateProfile } from './content';
import ResumeSlip from './ResumeSlip';
import type { ModuleId } from './timeline';

type ArchiveDeskProps = {
  onSelect: (id: ModuleId) => void;
  onResume: () => void;
};

function CardArrow() {
  return (
    <span className="archive-desk-card-arrow" aria-hidden="true">
      <ArrowUpRight size={28} />
    </span>
  );
}

export default function ArchiveDesk({ onSelect, onResume }: ArchiveDeskProps) {
  return (
    <div className="archive-desk">
      <div className="archive-desk-module archive-desk-about" data-module="about">
        <button className="archive-desk-about-main" type="button" onClick={() => onSelect('about')} aria-label="Read about this archive">
          <span className="archive-desk-about-sheet">
            <span className="archive-desk-eyebrow">01 / {templateProfile.brand}</span>
            <strong className="archive-desk-about-title">A little<br /><span className="archive-desk-title-accent">about me.</span></strong>
            <span className="archive-desk-about-description">Ideas. Images. Everyday things.</span>
            <span className="archive-desk-about-copy">An unfinished collection.<br />A place to begin again.</span>
          </span>
          <CardArrow />
        </button>
      </div>
      <ResumeSlip onOpen={onResume} />

      <button type="button" className="archive-desk-module archive-desk-fragments" data-module="fragments" onClick={() => onSelect('fragments')} aria-label="Open collected fragments">
        <span className="archive-desk-eyebrow">02</span>
        <strong className="archive-desk-stat">Less.</strong>
        <span className="archive-desk-stat-label">But considered.</span>
        <span className="archive-desk-fragment-facts">A collection of small observations.</span>
        <CardArrow />
      </button>

      <button type="button" className="archive-desk-module archive-desk-craft" data-module="craft" onClick={() => onSelect('craft')} aria-label="Explore the creative practice">
        <span className="archive-desk-eyebrow">03</span>
        <strong className="archive-desk-module-title">Following<br />the details.</strong>
        <span className="archive-desk-craft-marks" aria-hidden="true">
          <Pencil size={34} /><Circle size={34} /><Box size={34} />
        </span>
        <span className="archive-desk-craft-copy">Observe / Sketch / Make</span>
        <span className="archive-desk-platforms">A practice in progress.</span>
        <CardArrow />
      </button>

      <button type="button" className="archive-desk-module archive-desk-perspective" data-module="perspective" onClick={() => onSelect('perspective')} aria-label="Read notes on perspective">
        <span className="archive-desk-eyebrow">04</span>
        <strong className="archive-desk-module-title">A different<br />way to look.</strong>
        <span className="archive-desk-user-tag">ALWAYS CURIOUS</span>
        <span className="archive-desk-user-fact">Room for another point of view.</span>
        <CardArrow />
      </button>

      <button type="button" className="archive-desk-module archive-desk-collaboration" data-module="collaboration" onClick={() => onSelect('collaboration')} aria-label="Contact and collaboration">
        <span className="archive-desk-eyebrow">06</span>
        <strong className="archive-desk-module-title">Something<br />in mind?</strong>
        <span className="archive-desk-email"><span>{contactEmail}</span><span>{contactPhone}</span></span>
        <CardArrow />
      </button>
    </div>
  );
}
