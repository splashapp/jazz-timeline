import type { Song } from "../types/game";
import { genreColorStyle } from "../utils/genreColors";

interface Props {
  song: Song;
  onClose: () => void;
}

// Same backdrop/panel material as InfoModal (the "about the developer"
// modal), but for a song's curated context fact — reached via the small
// "i" button next to the reveal-face context line. Deliberately a pull,
// not a push: the one-sentence fact on the card is enough for most players,
// this is only for the ones who want a beat more.
export function SongInfoModal({ song, onClose }: Props) {
  return (
    <div className="info-modal-backdrop" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="info-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <span className="eyebrow-tag genre-accent" style={genreColorStyle(song.genre)}>
          <span className="genre-badge-icon" aria-hidden="true" />
          {song.genre}
        </span>
        <h2 className="info-modal-title">{song.year}</h2>
        <div className="info-modal-bio">
          <p>
            <strong>{song.artist}</strong> — {song.title}
          </p>
          {song.context && <p>{song.context}</p>}
        </div>
      </div>
    </div>
  );
}
