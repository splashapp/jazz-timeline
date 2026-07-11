import type { Song, PlacedCard, TurnPhase } from "../types/game";
import { genreColorStyle } from "../utils/genreColors";

// Long artist credits (e.g. "Christian Scott aTunde Adjuah") wrap to two
// lines; step the font down so that second line still fits comfortably
// without pushing the title/button below the visible card area.
function artistFontSize(name: string): string {
  if (name.length > 26) return "18px";
  if (name.length > 20) return "20px";
  return "24px";
}

interface Props {
  turnPhase: TurnPhase;
  currentSong: Song | null;
  placedCard: PlacedCard | undefined;
  loading: boolean;
  error: string | null;
  playbackBlocked: boolean;
  nowPlaying: Song | null;
  isPlaying: boolean;
  onManualPlay: () => void;
  onTogglePlay: () => void;
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
  nowPlaying,
  isPlaying,
  onManualPlay,
  onTogglePlay,
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
        <div className="turn-card-topbar-right">
          <span className="turn-card-round">{roundLabel}</span>
          {currentSong && (
            <button
              type="button"
              className="play-pause-btn"
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <span className="icon-bars">
                  <span />
                  <span />
                </span>
              ) : (
                <span className="icon-triangle" />
              )}
            </button>
          )}
        </div>
      </div>
      <div className={`turn-card-inner${flipped ? " is-flipped" : ""}`}>
        <div className="turn-card-face front">
          <div className="vinyl-rig">
            <div className={`tonearm${spinning ? " dropped" : ""}`}>
              <svg className="tonearm-arm" viewBox="0 0 40 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="tonearmGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e8d9b0" />
                    <stop offset="100%" stopColor="#a88c55" />
                  </linearGradient>
                </defs>
                <path
                  d="M20,6 C6,25 6,70 20,94"
                  fill="none"
                  stroke="url(#tonearmGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="tonearm-pivot" />
              <span className="tonearm-head" />
            </div>
            <div className={`vinyl${spinning ? " spinning" : ""}`}>
              <span className="vinyl-label">
                <span className="vinyl-label-text">JAZZ</span>
              </span>
            </div>
            <div className="vinyl-sheen" />
          </div>

          {turnPhase === "ready" && (
            <>
              <p className="turn-card-hint">Drop the needle</p>
              <button className="pill-btn primary" onClick={onPlay}>
                Play Song
              </button>
            </>
          )}

          {turnPhase === "listening" && (
            <>
              {loading && <p className="turn-card-hint">Loading song …</p>}
              {error && <p className="turn-card-error">{error}</p>}
              {!loading && !error && playbackBlocked && (
                <>
                  <p className="turn-card-hint">Autoplay blocked</p>
                  <button className="pill-btn primary" onClick={onManualPlay}>
                    🔊 Play Sound
                  </button>
                </>
              )}
              {!loading && !error && !playbackBlocked && (
                <p className="turn-card-hint">Song is playing — place it below</p>
              )}
            </>
          )}

          {turnPhase === "guessing" && (
            <p className="turn-card-hint">Almost there — want to guess?</p>
          )}
        </div>

        <div className="turn-card-face back">
          {currentSong &&
            (() => {
              const displaySong = nowPlaying ?? currentSong;
              return (
                <>
                  {nowPlaying && <span className="eyebrow-tag replay-tag">🔊 Replaying</span>}
                  <div className="reveal-year">{displaySong.year}</div>
                  <span className="eyebrow-tag genre-accent" style={genreColorStyle(displaySong.genre)}>
                    <span className="genre-badge-icon" aria-hidden="true" />
                    {displaySong.genre}
                  </span>
                  <h3 className="reveal-artist" style={{ fontSize: artistFontSize(displaySong.artist) }}>
                    {displaySong.artist}
                  </h3>
                  <p className="reveal-title">{displaySong.title}</p>

                  {!nowPlaying &&
                    placedCard &&
                    (() => {
                      const hasArtistGuess = placedCard.artistGuess.trim().length > 0;
                      const valueClass = (hasValue: boolean, correct: boolean) =>
                        correct ? "hit" : hasValue ? "filled" : "empty";
                      return (
                        <ul className="reveal-points">
                          <li>
                            <span className="reveal-points-label">Placement</span>
                            <span
                              className={`reveal-points-value ${placedCard.correctPlacement ? "hit" : "empty"}`}
                            >
                              {placedCard.correctPlacement ? "+1" : "—"}
                            </span>
                          </li>
                          <li>
                            <span className="reveal-points-label">Exact Year</span>
                            <span
                              className={`reveal-points-value ${valueClass(placedCard.yearGuess !== null, placedCard.correctYear)}`}
                            >
                              {placedCard.yearGuess ?? "—"}
                            </span>
                          </li>
                          <li>
                            <span className="reveal-points-label">Artist</span>
                            <span
                              className={`reveal-points-value ${valueClass(hasArtistGuess, placedCard.correctArtist)}`}
                            >
                              {hasArtistGuess ? placedCard.artistGuess.trim() : "—"}
                            </span>
                          </li>
                          {placedCard.correctGenre !== null && (
                            <li>
                              <span className="reveal-points-label">Genre</span>
                              <span
                                className={`reveal-points-value ${valueClass(placedCard.genreGuess !== null, placedCard.correctGenre)}`}
                              >
                                {placedCard.genreGuess ?? "—"}
                              </span>
                            </li>
                          )}
                        </ul>
                      );
                    })()}

                  {nowPlaying && playbackBlocked && (
                    <button className="pill-btn primary" onClick={onManualPlay}>
                      🔊 Play Sound
                    </button>
                  )}

                  <button className="pill-btn primary" onClick={onNext}>
                    {nextLabel}
                  </button>
                </>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
