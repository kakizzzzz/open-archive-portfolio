import { templateProfile } from './content';

type IntroChromeProps = {
  onOpen: () => void;
};

export default function IntroChrome({ onOpen }: IntroChromeProps) {
  return (
    <>
      <header className="archive-intro-header">
        <div className="archive-intro-brand">
          <span className="archive-intro-brand-name">{templateProfile.brand}</span>
          <span className="archive-intro-brand-separator" aria-hidden="true">/</span>
          <span className="archive-intro-brand-discipline">{templateProfile.discipline}</span>
        </div>
        <span className="archive-intro-role">A COLLECTION IN PROGRESS</span>
      </header>
      <footer className="archive-intro-footer">
        <span>OPEN ARCHIVE / <a className="archive-intro-credit" href="https://github.com/kakizzzzz/open-archive-portfolio" target="_blank" rel="noopener noreferrer">BY KAKI</a></span>
        <button className="archive-intro-skip" type="button" onClick={onOpen}>OPEN ARCHIVE ↗</button>
      </footer>
    </>
  );
}
