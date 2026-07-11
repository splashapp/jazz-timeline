import { useState } from "react";
import { GENRES } from "../types/game";
import type { Genre } from "../types/game";

interface Props {
  genreEnabled: boolean;
  onSubmit: (yearGuess: number | null, artistGuess: string, genreGuess: Genre | null) => void;
}

export function GuessForm({ genreEnabled, onSubmit }: Props) {
  const [year, setYear] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState<Genre | "">("");

  return (
    <div className="guess-form">
      <p className="hint">Bonus points for guessing (optional):</p>
      <label className="field">
        Release Year
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="e.g. 1959"
        />
      </label>
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
        onClick={() =>
          onSubmit(year ? Number(year) : null, artist, genreEnabled ? genre || null : null)
        }
      >
        Reveal
      </button>
    </div>
  );
}
