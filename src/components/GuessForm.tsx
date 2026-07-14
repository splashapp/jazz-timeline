import { useState } from "react";
import { GENRES } from "../types/game";
import type { Genre } from "../types/game";

interface Props {
  genreEnabled: boolean;
  onSubmit: (artistGuess: string, genreGuess: Genre | null) => void;
}

// The year guess no longer lives here — it's already set by the timeline's
// press-and-drag year slider at the moment the card was placed.
export function GuessForm({ genreEnabled, onSubmit }: Props) {
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState<Genre | "">("");

  return (
    <div className="guess-form">
      <p className="hint">Bonus points for guessing (optional):</p>
      <label className="field">
        Artist / Composer (Last Name)
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Last name"
        />
      </label>
      {genreEnabled && (
        <label className="field">
          Genre
          <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)}>
            <option value="">-- select --</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        className="pill-btn primary"
        onClick={() => onSubmit(artist, genreEnabled ? genre || null : null)}
      >
        Reveal
      </button>
    </div>
  );
}
