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
      <p className="hint">Zusatzpunkte durch Raten (optional):</p>
      <label className="field">
        Erscheinungsjahr
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="z.B. 1959"
        />
      </label>
      <label className="field">
        Interpret / Komponist (Nachname)
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Nachname"
        />
      </label>
      {genreEnabled && (
        <label className="field">
          Genre
          <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)}>
            <option value="">-- wählen --</option>
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
        Auflösen
      </button>
    </div>
  );
}
