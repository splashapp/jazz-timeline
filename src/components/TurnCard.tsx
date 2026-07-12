import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Song, PlacedCard, TurnPhase } from "../types/game";
import { genreColorStyle } from "../utils/genreColors";
import { InfoModal } from "./InfoModal";

// Long artist credits (e.g. "Christian Scott aTunde Adjuah") wrap to two
// lines; step the font down so that second line still fits comfortably
// without pushing the title/button below the visible card area.
function artistFontSize(name: string): string {
  if (name.length > 26) return "18px";
  if (name.length > 20) return "20px";
  return "24px";
}

// Matches .turn-card-face's own top+bottom padding — used to translate a
// measured content height back into the height the flip area needs.
const FACE_VERTICAL_PADDING = 24 + 28;

interface Props {
  turnPhase: TurnPhase;
  currentSong: Song | null;
  placedCard: PlacedCard | undefined;
  songReady: boolean;
  starting: boolean;
  error: string | null;
  nowPlaying: Song | null;
  isPlaying: boolean;
  onPlaySong: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  nextLabel: string;
  playerName: string;
  roundLabel: string;
}

export function TurnCard({
  turnPhase,
  currentSong,
  placedCard,
  songReady,
  starting,
  error,
  nowPlaying,
  isPlaying,
  onPlaySong,
  onTogglePlay,
  onNext,
  nextLabel,
  playerName,
  roundLabel,
}: Props) {
  // Reflects the actual player state — the needle only drops once audio is
  // genuinely playing, whether that's the current turn's song, still
  // playing through "guessing"/"revealed", or a replayed song from the
  // timeline.
  const spinning = isPlaying;
  const flipped = turnPhase === "revealed";

  // Hidden by default: seeing your own guessed text next to a green "+1"
  // imprints your guess rather than the correct answer (already shown as
  // the big year/artist/genre badge). Tapping the table reveals it on
  // request instead. Resets so each new reveal starts collapsed again.
  const [showGuesses, setShowGuesses] = useState(false);
  useEffect(() => {
    setShowGuesses(false);
  }, [placedCard]);

  const [infoOpen, setInfoOpen] = useState(false);

  // Both faces are absolutely stacked (needed for the 3D flip), so neither
  // can grow the card via normal flow — a long 2-line artist name would
  // just get clipped/scrolled instead. Measure each face's natural content
  // height and let the card grow to fit the taller one, so the Next button
  // is never cut off; short content still gets the compact default height.
  const frontContentRef = useRef<HTMLDivElement>(null);
  const backContentRef = useRef<HTMLDivElement>(null);
  const [minFlipHeight, setMinFlipHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const measure = () => {
      const frontH = frontContentRef.current?.scrollHeight ?? 0;
      const backH = backContentRef.current?.scrollHeight ?? 0;
      setMinFlipHeight(Math.max(frontH, backH) + FACE_VERTICAL_PADDING);
    };
    measure();
    // Web fonts (Cinzel/Space Grotesk/Space Mono) can still be loading on
    // first paint; re-measure once they're in so the initial height isn't
    // based on a fallback font's metrics.
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [turnPhase, currentSong, placedCard, nowPlaying, showGuesses, songReady, starting, error]);

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

      {/* Reserved-height block above (.turn-card-topbar) means this area
          can never collide with it, regardless of face content height. */}
      <div className="turn-card-flip-area" style={{ minHeight: minFlipHeight }}>
        <div className={`turn-card-inner${flipped ? " is-flipped" : ""}`}>
          <div className="turn-card-face front">
            {/* .turn-card-face-content uses margin:auto to center when it
                fits and to fall back to top-aligned + scrollable when it
                doesn't, instead of justify-content:center clipping equally
                off both ends (which silently cut off the Next button when
                a face's content got taller than the available height). */}
            <div className="turn-card-face-content" ref={frontContentRef}>
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

              {(turnPhase === "ready" || turnPhase === "listening") && (
                <>
                  {error && <p className="turn-card-error">{error}</p>}
                  {!error && !songReady && <p className="turn-card-hint">Searching …</p>}
                  {!error && songReady && !isPlaying && !starting && (
                    <button type="button" className="pill-btn primary turn-card-play-btn" onClick={onPlaySong}>
                      ▶ Play Song
                    </button>
                  )}
                  {!error && songReady && !isPlaying && starting && (
                    <p className="turn-card-hint">Starting …</p>
                  )}
                  {!error && songReady && isPlaying && (
                    <p className="turn-card-hint">Song is playing — place it below</p>
                  )}
                </>
              )}

              {turnPhase === "guessing" && (
                <p className="turn-card-hint">Almost there — want to guess?</p>
              )}
            </div>
          </div>

          <div className="turn-card-face back">
            <div className="turn-card-face-content" ref={backContentRef}>
              {currentSong &&
                (() => {
                  const displaySong = nowPlaying ?? currentSong;
                  return (
                    <>
                      {nowPlaying && <span className="eyebrow-tag replay-tag">🔊 Replaying</span>}
                      <div className="reveal-head">
                        <span
                          className="eyebrow-tag genre-accent"
                          style={genreColorStyle(displaySong.genre)}
                        >
                          <span className="genre-badge-icon" aria-hidden="true" />
                          {displaySong.genre}
                        </span>
                        <div className="reveal-year">{displaySong.year}</div>
                      </div>
                      <h3
                        className="reveal-artist"
                        style={{ fontSize: artistFontSize(displaySong.artist) }}
                      >
                        {displaySong.artist}
                      </h3>
                      <p className="reveal-title">{displaySong.title}</p>

                      {!nowPlaying &&
                        placedCard &&
                        (() => {
                          const hasArtistGuess = placedCard.artistGuess.trim().length > 0;
                          const valueClass = (hasValue: boolean, correct: boolean) =>
                            correct ? "hit" : hasValue ? "filled" : "empty";
                          // Collapsed: always "+1"/"—" by correctness, never the
                          // guessed text (even when correct — the point is the
                          // hit, not re-displaying what you typed). Expanded (on
                          // tap): show what was actually guessed for each field.
                          const cell = (hasValue: boolean, correct: boolean, text: string) =>
                            showGuesses ? (
                              <span className={`reveal-points-value ${valueClass(hasValue, correct)}`}>
                                {hasValue ? text : "—"}
                              </span>
                            ) : (
                              <span className={`reveal-points-value ${correct ? "hit" : "empty"}`}>
                                {correct ? "+1" : "—"}
                              </span>
                            );
                          const toggle = () => setShowGuesses((v) => !v);
                          return (
                            <div className="reveal-points-group">
                              <ul
                                className="reveal-points"
                                onClick={toggle}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggle();
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={showGuesses ? "Hide your answers" : "Show your answers"}
                              >
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
                                  {cell(
                                    placedCard.yearGuess !== null,
                                    placedCard.correctYear,
                                    String(placedCard.yearGuess),
                                  )}
                                </li>
                                <li>
                                  <span className="reveal-points-label">Artist</span>
                                  {cell(
                                    hasArtistGuess,
                                    placedCard.correctArtist,
                                    placedCard.artistGuess.trim(),
                                  )}
                                </li>
                                {placedCard.correctGenre !== null && (
                                  <li>
                                    <span className="reveal-points-label">Genre</span>
                                    {cell(
                                      placedCard.genreGuess !== null,
                                      placedCard.correctGenre,
                                      placedCard.genreGuess ?? "",
                                    )}
                                  </li>
                                )}
                              </ul>
                              <p className="reveal-points-hint">
                                {showGuesses ? "Tap to hide your answers" : "Tap to see your answers"}
                              </p>
                            </div>
                          );
                        })()}

                      <button className="pill-btn primary turn-card-next-btn" onClick={onNext}>
                        {nextLabel}
                      </button>
                    </>
                  );
                })()}
            </div>
          </div>
        </div>
      </div>

      {/* Sits outside .turn-card-flip-area (which is what actually flips),
          so one button/modal pair works identically on both the front
          (vinyl/loading) and back (reveal) faces instead of needing to be
          duplicated per face. */}
      <button
        type="button"
        className="turn-card-info-btn"
        onClick={() => setInfoOpen(true)}
        aria-label="About Jazz Timeline"
      >
        i
      </button>
      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
    </div>
  );
}
