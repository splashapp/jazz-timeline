import type { MediaService } from "../types/game";

interface Props {
  onSelect: (service: MediaService) => void;
}

function YouTubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9.5v5l4.5-2.5-4.5-2.5z" fill="currentColor" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M7 10c3.2-1 6.9-.6 9.6 1M7.6 13c2.6-.8 5.5-.5 7.7.8M8.2 16c2-.6 4.3-.4 6 .6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppleMusicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 5.2v9.6a2.6 2.6 0 1 1-1.4-2.3V8.4L10 9.6v6.1a2.6 2.6 0 1 1-1.4-2.3V7.2L16 5.2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MediaSelectScreen({ onSelect }: Props) {
  return (
    <div className="screen media-select">
      <span className="eyebrow-tag">Jazz Timeline</span>
      <h1>Leg die Nadel auf</h1>
      <p className="subtitle">Mit welchem Musikdienst möchtet ihr spielen?</p>
      <div className="media-options">
        <button className="media-button active" onClick={() => onSelect("youtube")}>
          <YouTubeIcon />
          YouTube
        </button>
        <button className="media-button disabled" disabled>
          <SpotifyIcon />
          Spotify
          <span className="badge">bald verfügbar</span>
        </button>
        <button className="media-button disabled" disabled>
          <AppleMusicIcon />
          Apple Music
          <span className="badge">bald verfügbar</span>
        </button>
      </div>
    </div>
  );
}
