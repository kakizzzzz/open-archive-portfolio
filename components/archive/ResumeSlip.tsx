import { templateProfile } from './content';

type ResumeSlipProps = {
  onOpen: () => void;
};

export default function ResumeSlip({ onOpen }: ResumeSlipProps) {
  return (
    <button className="archive-resume-slip" type="button" onClick={onOpen} aria-label="Open the profile">
      <span className="archive-resume-paper">
        <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <rect width="210" height="297" fill="#ffffff" />
          <text x="17" y="47" fill="#171717" fontFamily="Arial, sans-serif" fontSize="23" fontWeight="800" letterSpacing="-1">{templateProfile.name}</text>

          <g fill="#d1d1d1">
            <rect x="17" y="72" width="113" height="3" />
            <rect x="17" y="84" width="157" height="3" />
          </g>

          <g fill="#171717">
            <rect x="25" y="125" width="49" height="3" />
            <rect x="25" y="195" width="41" height="3" />
          </g>
          <g fill="#171717">
            <rect x="17" y="123" width="3" height="7" />
            <rect x="17" y="193" width="3" height="7" />
          </g>
          <g fill="#d1d1d1">
            <rect x="17" y="138" width="169" height="2.5" />
            <rect x="17" y="150" width="126" height="2.5" />
            <rect x="17" y="208" width="158" height="2.5" />
            <rect x="17" y="220" width="108" height="2.5" />
          </g>
        </svg>
      </span>
      <span className="archive-resume-slip-label">
        <span>Profile</span>
        <svg className="archive-resume-slip-arrow" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M6 18 18 6M6 6h12v12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
