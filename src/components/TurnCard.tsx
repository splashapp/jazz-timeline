import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Song, PlacedCard, TurnPhase } from "../types/game";
import { genreColorStyle } from "../utils/genreColors";
import { InfoModal } from "./InfoModal";
import { SongInfoModal } from "./SongInfoModal";
import type { TimelineHandle } from "./Timeline";
import { useCardPlacementDrag } from "../hooks/useCardPlacementDrag";

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

const ODOMETER_DURATION_MS = 700;

// Tweens the displayed year from the player's guess up/down to the true
// release year once `active` flips true — the rolled distance makes the
// size of the miss (or the thrill of a hit) physically felt, not just read.
function useOdometer(target: number, start: number | null, active: boolean): number {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!active || start === null || start === target) {
      setDisplay(target);
      return;
    }
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - t0) / ODOMETER_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, start, target]);

  return display;
}

interface Props {
  turnPhase: TurnPhase;
  currentSong: Song | null;
  placedCard: PlacedCard | undefined;
  songReady: boolean;
  starting: boolean;
  error: string | null;
  nowPlaying: Song | null;
  isPlaying: boolean;
  timelineRef: React.RefObject<TimelineHandle | null>;
  onCommitPlacement: (index: number) => void;
  onHoverChange: (index: number | null) => void;
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
  timelineRef,
  onCommitPlacement,
  onHoverChange,
  onPlaySong,
  onTogglePlay,
  onNext,
  nextLabel,
  playerName,
  roundLabel,
}: Props) {
  // Reflects the actual player state — the needle only drops once audio is
  // genuinely playing, whether that's the current turn's song, still
  // playing through to "revealed", or a replayed song from the timeline.
  const spinning = isPlaying;

  const cardRef = useRef<HTMLDivElement>(null);
  const { dragging, cardTransform, startDrag } = useCardPlacementDrag({
    timelineRef,
    cardRef,
    onCommit: onCommitPlacement,
    onHoverChange,
  });

  // Invites the grab (Scene 2) only once the song is actually playing and
  // nothing has been picked up yet.
  const grabbable = turnPhase === "listening" && isPlaying && !dragging;
  // Third card state: locked in but not yet truth (Scenes 3–8) — genre
  // badge still shows, dashed border marks "draft, not yet revealed".
  const pending = dragging || turnPhase === "guessing-year" || turnPhase === "joker";
  // The actual flip only ever happens at the real reveal — no early peek.
  const flipped = turnPhase === "revealed";

  const [infoOpen, setInfoOpen] = useState(false);
  const [songInfoOpen, setSongInfoOpen] = useState(false);

  const displaySong = nowPlaying ?? currentSong;
  const revealActive = turnPhase === "revealed" && !nowPlaying;
  const odometerYear = useOdometer(displaySong?.year ?? 0, placedCard?.yearGuess ?? null, revealActive);

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
  }, [turnPhase, currentSong, placedCard, nowPlaying, songReady, starting, error]);

  return (
    <div
      className={`turn-card${dragging ? " dragging" : ""}${grabbable ? " grabbable" : ""}`}
      ref={cardRef}
      style={dragging && cardTransform ? { transform: cardTransform } : undefined}
    >
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
          <div
            className={`turn-card-face front${pending ? " pending" : ""}`}
            onPointerDown={turnPhase === "listening" && isPlaying ? startDrag : undefined}
          >
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

              {turnPhase === "ready" || turnPhase === "listening" ? (
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
                    <p className="turn-card-hint">Pick up the card and place it below</p>
                  )}
                </>
              ) : (
                <>
                  {turnPhase === "guessing-year" && (
                    <p className="turn-card-hint">Dial in the exact year below</p>
                  )}
                  {turnPhase === "joker" && <p className="turn-card-hint">Risk a joker?</p>}
                </>
              )}
            </div>
          </div>

          <div className="turn-card-face back">
            <div className="turn-card-face-content" ref={backContentRef}>
              {displaySong &&
                (() => {
                  const cardYear = revealActive ? odometerYear : displaySong.year;
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
                        <div
                          className="reveal-year"
                          key={turnPhase === "revealed" ? `revealed-${displaySong.id}` : "idle"}
                        >
                          {cardYear}
                        </div>
                      </div>

                      {turnPhase === "revealed" && (
                        <>
                          <h3
                            className="reveal-artist"
                            style={{ fontSize: artistFontSize(displaySong.artist) }}
                          >
                            {displaySong.artist}
                          </h3>
                          <p className="reveal-title">{displaySong.title}</p>
                        </>
                      )}

                      {turnPhase === "revealed" && !nowPlaying && placedCard && (
                        <>
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
                              <span className="reveal-points-label">
                                Exact Year{placedCard.jokerUsed === "year" ? " (Joker ×2)" : ""}
                              </span>
                              <span
                                className={`reveal-points-value ${
                                  placedCard.correctYear
                                    ? "hit"
                                    : placedCard.jokerUsed === "year"
                                      ? "penalty"
                                      : "empty"
                                }`}
                              >
                                {placedCard.correctYear
                                  ? placedCard.jokerUsed === "year"
                                    ? "+2"
                                    : "+1"
                                  : placedCard.jokerUsed === "year"
                                    ? "−2"
                                    : "—"}
                              </span>
                            </li>
                            {placedCard.jokerUsed === "artist" && (
                              <li>
                                <span className="reveal-points-label">Artist (Joker)</span>
                                <span
                                  className={`reveal-points-value ${placedCard.correctArtist ? "hit" : "penalty"}`}
                                >
                                  {placedCard.correctArtist ? "+1" : "−2"}
                                </span>
                              </li>
                            )}
                          </ul>

                          {displaySong.context && (
                            <div className="reveal-context">
                              <p className="reveal-context-text">“{displaySong.context}”</p>
                              <button
                                type="button"
                                className="reveal-context-info-btn"
                                onClick={() => setSongInfoOpen(true)}
                                aria-label="More about this recording"
                              >
                                i
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {turnPhase === "revealed" && (
                        <button className="pill-btn primary turn-card-next-btn" onClick={onNext}>
                          {nextLabel}
                        </button>
                      )}
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
      {songInfoOpen && displaySong && (
        <SongInfoModal song={displaySong} onClose={() => setSongInfoOpen(false)} />
      )}
    </div>
  );
}
