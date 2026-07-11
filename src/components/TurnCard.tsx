import type { Song, PlacedCard, TurnPhase } from "../types/game";

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
                  <span className="eyebrow-tag">{displaySong.genre}</span>
                  <div className="reveal-year">{displaySong.year}</div>
                  <h3 className="reveal-title">{displaySong.title}</h3>
                  <p className="reveal-artist">{displaySong.artist}</p>

                  {!nowPlaying && placedCard && (
                    <ul className="reveal-points">
                      <li className={placedCard.correctPlacement ? "hit" : "miss"}>
                        <span>Placement</span>
                        <span>{placedCard.correctPlacement ? "+1" : "—"}</span>
                      </li>
                      <li className={placedCard.correctYear ? "hit" : "miss"}>
                        <span>Exact Year</span>
                        <span>{placedCard.yearGuess ?? "—"}</span>
                      </li>
                      <li className={placedCard.correctArtist ? "hit" : "miss"}>
                        <span>Artist</span>
                        <span>{placedCard.artistGuess.trim() || "—"}</span>
                      </li>
                      {placedCard.correctGenre !== null && (
                        <li className={placedCard.correctGenre ? "hit" : "miss"}>
                          <span>Genre</span>
                          <span>{placedCard.genreGuess ?? "—"}</span>
                        </li>
                      )}
                    </ul>
                  )}

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
