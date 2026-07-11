import type { Song, PlacedCard, TurnPhase } from "../types/game";

interface Props {
  turnPhase: TurnPhase;
  currentSong: Song | null;
  placedCard: PlacedCard | undefined;
  loading: boolean;
  error: string | null;
  playbackBlocked: boolean;
  onManualPlay: () => void;
  onPlay: () => void;
  onNext: () => void;
  nextLabel: string;
  playerName: string;
  roundLabel: string;
}

export function TurnCard({
  turnPhase,
  currentSong,
  placedCard,
  loading,
  error,
  playbackBlocked,
  onManualPlay,
  onPlay,
  onNext,
  nextLabel,
  playerName,
  roundLabel,
}: Props) {
  const spinning = turnPhase === "listening" || turnPhase === "guessing";
  const flipped = turnPhase === "revealed";

  return (
    <div className="turn-card">
      <div className="turn-card-topbar">
        <span className="turn-card-player">{playerName}</span>
        <span className="turn-card-round">{roundLabel}</span>
      </div>
      <div className={`turn-card-inner${flipped ? " is-flipped" : ""}`}>
        <div className="turn-card-face front">
          <div className="vinyl-rig">
            <div className={`tonearm${spinning ? " dropped" : ""}`}>
              <span className="tonearm-head" />
            </div>
            <div className={`vinyl${spinning ? " spinning" : ""}`}>
              <span className="vinyl-label" />
            </div>
          </div>

          {turnPhase === "ready" && (
            <>
              <p className="turn-card-hint">Leg die Nadel auf</p>
              <button className="pill-btn primary" onClick={onPlay}>
                Song abspielen
              </button>
            </>
          )}

          {turnPhase === "listening" && (
            <>
              {loading && <p className="turn-card-hint">Lade Song …</p>}
              {error && <p className="turn-card-error">{error}</p>}
              {!loading && !error && playbackBlocked && (
                <>
                  <p className="turn-card-hint">Autoplay blockiert</p>
                  <button className="pill-btn primary" onClick={onManualPlay}>
                    🔊 Ton abspielen
                  </button>
                </>
              )}
              {!loading && !error && !playbackBlocked && (
                <p className="turn-card-hint">Song läuft — ordne ihn unten ein</p>
              )}
            </>
          )}

          {turnPhase === "guessing" && (
            <p className="turn-card-hint">Fast geschafft — noch raten?</p>
          )}
        </div>

        <div className="turn-card-face back">
          {currentSong && (
            <>
              <span className="eyebrow-tag">{currentSong.genre}</span>
              <div className="reveal-year">{currentSong.year}</div>
              <h3 className="reveal-title">{currentSong.title}</h3>
              <p className="reveal-artist">{currentSong.artist}</p>

              {placedCard && (
                <ul className="reveal-points">
                  <li className={placedCard.correctPlacement ? "hit" : "miss"}>
                    <span>Platzierung</span>
                    <span>{placedCard.correctPlacement ? "+1" : "—"}</span>
                  </li>
                  <li className={placedCard.correctYear ? "hit" : "miss"}>
                    <span>Jahr genau</span>
                    <span>{placedCard.correctYear ? "+1" : "—"}</span>
                  </li>
                  <li className={placedCard.correctArtist ? "hit" : "miss"}>
                    <span>Interpret</span>
                    <span>{placedCard.correctArtist ? "+1" : "—"}</span>
                  </li>
                  {placedCard.correctGenre !== null && (
                    <li className={placedCard.correctGenre ? "hit" : "miss"}>
                      <span>Genre</span>
                      <span>{placedCard.correctGenre ? "+1" : "—"}</span>
                    </li>
                  )}
                </ul>
              )}

              <button className="pill-btn primary" onClick={onNext}>
                {nextLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
