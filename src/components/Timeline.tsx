import { useState } from "react";
import { createPortal } from "react-dom";
import type { PlacedCard, Song } from "../types/game";
import { genreColorStyle } from "../utils/genreColors";
import { SONG_YEAR_RANGE } from "../state/gameReducer";

interface Props {
  timeline: PlacedCard[];
  placementMode: boolean;
  onPlace?: (index: number, yearGuess: number) => void;
  // Fired continuously while dragging (including the very first frame, at
  // the picker's starting midpoint) — lets the turn card flip immediately
  // on press and show a live-updating year that matches the slider.
  onDragUpdate?: (year: number) => void;
  onCardClick?: (song: Song) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function Timeline({ timeline, placementMode, onPlace, onDragUpdate, onCardClick }: Props) {
  const slots = timeline.length + 1;

  // The slot currently being dragged, its year bounds (derived from the
  // neighboring cards on each side), and the year the pointer is currently
  // over. Only one slot can be active at a time.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeBounds, setActiveBounds] = useState<{ min: number; max: number } | null>(null);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  // The picker's own on-screen position, captured once at drag-start —
  // used to position the portaled overlay below via fixed coordinates.
  const [activeRect, setActiveRect] = useState<DOMRect | null>(null);

  if (timeline.length === 0 && !placementMode) {
    return <p className="empty-timeline">No cards placed yet.</p>;
  }

  const boundsFor = (index: number) => ({
    min: index > 0 ? timeline[index - 1].song.year : SONG_YEAR_RANGE.min,
    max: index < timeline.length ? timeline[index].song.year : SONG_YEAR_RANGE.max,
  });

  const yearFromPointer = (clientX: number, track: HTMLElement, min: number, max: number) => {
    const rect = track.getBoundingClientRect();
    const fraction = rect.width === 0 ? 0 : clamp((clientX - rect.left) / rect.width, 0, 1);
    return max === min ? min : Math.round(min + fraction * (max - min));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const bounds = boundsFor(index);
    setActiveIndex(index);
    setActiveBounds(bounds);
    setActiveRect(e.currentTarget.getBoundingClientRect());
    // The element is still its small, un-expanded size at this exact
    // instant (the "active" re-render hasn't painted yet), so start at the
    // midpoint rather than trying to map this initial position — every
    // subsequent pointermove (after the wider track has rendered) maps the
    // pointer's real position to a year.
    const startYear = Math.round((bounds.min + bounds.max) / 2);
    setActiveYear(startYear);
    onDragUpdate?.(startYear);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeIndex === null || !activeBounds) return;
    const year = yearFromPointer(e.clientX, e.currentTarget, activeBounds.min, activeBounds.max);
    setActiveYear(year);
    onDragUpdate?.(year);
  };

  const commit = () => {
    if (activeIndex === null || activeYear === null) return;
    onPlace?.(activeIndex, activeYear);
    setActiveIndex(null);
    setActiveBounds(null);
    setActiveYear(null);
    setActiveRect(null);
  };

  return (
    <div className="timeline">
      <div className="timeline-track">
        {Array.from({ length: slots }).map((_, i) => {
          const isActive = activeIndex === i;
          // The expanded slider overlays on top of its (layout-wise still
          // small) picker box rather than actually growing it — growing the
          // real flex box only ever pushes LATER siblings, never pulls
          // earlier ones apart. So instead, the two cards immediately
          // adjacent to the active picker each get a translateX nudge
          // (visual-only, doesn't disturb anyone else's layout) to clear
          // room for the overlay to read as "cards parting either side of
          // the slider" rather than one-directional reflow.
          const isRightNeighborOfActive = activeIndex === i; // this card sits right after the active picker, same slot
          const isLeftNeighborOfActive = activeIndex === i + 1; // this card sits right before the next slot's active picker
          const fraction =
            isActive && activeBounds && activeYear !== null
              ? activeBounds.max === activeBounds.min
                ? 0
                : (activeYear - activeBounds.min) / (activeBounds.max - activeBounds.min)
              : 0;

          return (
            <div className="timeline-slot" key={`slot-${i}`}>
              {placementMode && (
                <div
                  className={`year-picker${isActive ? " active" : ""}`}
                  onPointerDown={(e) => handlePointerDown(e, i)}
                  onPointerMove={isActive ? handlePointerMove : undefined}
                  onPointerUp={isActive ? commit : undefined}
                  onPointerCancel={isActive ? commit : undefined}
                  role="slider"
                  aria-label="Choose release year"
                  aria-valuemin={isActive ? activeBounds?.min : undefined}
                  aria-valuemax={isActive ? activeBounds?.max : undefined}
                  aria-valuenow={isActive ? (activeYear ?? undefined) : undefined}
                >
                  {!isActive && <span className="year-picker-plus">+</span>}
                </div>
              )}
              {isActive &&
                activeRect &&
                // Portaled to <body>: .timeline scrolls horizontally
                // (overflow-x:auto), and per the CSS overflow spec that
                // forces the OTHER axis to compute as auto (clipping) even
                // when explicitly set to visible — there's no way for this
                // to escape vertically as a normal descendant. Fixed
                // positioning computed from the picker's own on-screen
                // rect sidesteps that entirely.
                createPortal(
                  <div
                    className="year-picker-expanded"
                    style={{
                      position: "fixed",
                      left: activeRect.left + activeRect.width / 2,
                      top: activeRect.top - 18,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    <span className="year-picker-value">{activeYear}</span>
                    <div className="year-picker-track">
                      <div className="year-picker-fill" style={{ width: `${fraction * 100}%` }} />
                      <div className="year-picker-thumb" style={{ left: `${fraction * 100}%` }} />
                    </div>
                  </div>,
                  document.body,
                )}
              {i < timeline.length &&
                (onCardClick ? (
                  <button
                    type="button"
                    className="timeline-card timeline-card-playable"
                    style={genreColorStyle(timeline[i].song.genre)}
                    onClick={() => onCardClick(timeline[i].song)}
                    aria-label={`Play ${timeline[i].song.title} again`}
                  >
                    <div className="card-year">{timeline[i].song.year}</div>
                    <div className="card-title">{timeline[i].song.title}</div>
                    <div className="card-artist">{timeline[i].song.artist}</div>
                    <span className="card-play-icon">🔊</span>
                  </button>
                ) : (
                  <div
                    className={`timeline-card${isRightNeighborOfActive ? " timeline-card--shift-right" : ""}${isLeftNeighborOfActive ? " timeline-card--shift-left" : ""}`}
                    style={genreColorStyle(timeline[i].song.genre)}
                  >
                    <div className="card-year">{timeline[i].song.year}</div>
                    <div className="card-title">{timeline[i].song.title}</div>
                    <div className="card-artist">{timeline[i].song.artist}</div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
