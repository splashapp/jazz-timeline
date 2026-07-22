import { forwardRef, useImperativeHandle, useRef } from "react";
import type { PlacedCard, Song } from "../types/game";
import { genreColorStyle } from "../utils/genreColors";

export interface TimelineHandle {
  // Index of the slot whose center is nearest clientX — used by the
  // placement drag to figure out which gap is currently "under" the card.
  getIndexAtX(clientX: number): number;
  // How far clientX has penetrated the left/right auto-scroll zone, so the
  // drag can rate-scroll the timeline without the finger needing to cross
  // the whole screen width itself.
  getEdgeIntensity(clientX: number): { edge: "left" | "right" | null; strength: number };
  scrollBy(dx: number): void;
}

interface Props {
  timeline: PlacedCard[];
  // Non-null exactly while a card is being dragged over a specific gap —
  // that gap gets a live glowing marker and its neighbors part slightly to
  // make room, instead of any picker being visible up front.
  hoveredIndex?: number | null;
  // Keeps the track (and its slot refs) mounted/interactive even when the
  // timeline is still empty, so the very first placement of the game has
  // somewhere for the drag to land.
  interactive?: boolean;
  // Song id currently sliding into its corrected chronological position —
  // gets a slower settle transition instead of the snappy default so the
  // correction reads as a deliberate move rather than a layout jump.
  settlingId?: string | null;
  onCardClick?: (song: Song) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const EDGE_ZONE = 56;

export const Timeline = forwardRef<TimelineHandle, Props>(function Timeline(
  { timeline, hoveredIndex = null, interactive = false, settlingId = null, onCardClick },
  ref,
) {
  const slots = timeline.length + 1;
  const scrollRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    getIndexAtX(clientX) {
      let best = 0;
      let bestDist = Infinity;
      slotRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(clientX - (rect.left + rect.width / 2));
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    },
    getEdgeIntensity(clientX) {
      const container = scrollRef.current;
      if (!container) return { edge: null, strength: 0 };
      const rect = container.getBoundingClientRect();
      if (clientX < rect.left + EDGE_ZONE) {
        return { edge: "left", strength: clamp((rect.left + EDGE_ZONE - clientX) / EDGE_ZONE, 0, 1) };
      }
      if (clientX > rect.right - EDGE_ZONE) {
        return { edge: "right", strength: clamp((clientX - (rect.right - EDGE_ZONE)) / EDGE_ZONE, 0, 1) };
      }
      return { edge: null, strength: 0 };
    },
    scrollBy(dx) {
      scrollRef.current?.scrollBy({ left: dx });
    },
  }));

  const showEmpty = timeline.length === 0 && !interactive;

  return (
    <div className="timeline" ref={scrollRef}>
      {showEmpty ? (
        <p className="empty-timeline">No cards placed yet.</p>
      ) : (
        <div className="timeline-track">
          {Array.from({ length: slots }).map((_, i) => {
            const isGapHovered = hoveredIndex === i;
            // The two cards immediately adjacent to the hovered gap nudge
            // aside (visual-only translateX, doesn't disturb layout for
            // anyone else) so the gap reads as "parting to make room"
            // rather than the marker just overlapping a neighbor.
            const isRightNeighbor = hoveredIndex === i;
            const isLeftNeighbor = hoveredIndex === i + 1;

            return (
              <div
                className="timeline-slot"
                key={`slot-${i}`}
                ref={(el) => {
                  slotRefs.current[i] = el;
                }}
              >
                {isGapHovered && (
                  <div className="gap-marker" aria-hidden="true">
                    <span className="gap-marker-glow" />
                  </div>
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
                      className={`timeline-card${isRightNeighbor ? " timeline-card--shift-right" : ""}${isLeftNeighbor ? " timeline-card--shift-left" : ""}${settlingId === timeline[i].song.id ? " timeline-card--settling" : ""}`}
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
      )}
    </div>
  );
});
