import type { PlacedCard } from "../types/game";

interface Props {
  timeline: PlacedCard[];
  placementMode: boolean;
  onPlace?: (index: number) => void;
}

export function Timeline({ timeline, placementMode, onPlace }: Props) {
  const slots = timeline.length + 1;

  if (timeline.length === 0 && !placementMode) {
    return <p className="empty-timeline">Noch keine Karten platziert.</p>;
  }

  return (
    <div className="timeline">
      <div className="timeline-track">
        {Array.from({ length: slots }).map((_, i) => (
          <div className="timeline-slot" key={`slot-${i}`}>
            {placementMode && (
              <button
                className="insert-chip"
                onClick={() => onPlace?.(i)}
                aria-label="Hier einordnen"
              >
                +
              </button>
            )}
            {i < timeline.length && (
              <div className="timeline-card">
                <div className="card-year">{timeline[i].song.year}</div>
                <div className="card-title">{timeline[i].song.title}</div>
                <div className="card-artist">{timeline[i].song.artist}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
