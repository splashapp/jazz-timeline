import type { PlacedCard } from "../types/game";

interface Props {
  nextPlayerName: string;
  timeline: PlacedCard[];
  onContinue: () => void;
}

// Scene 12 — an explicit, full-screen cut between turns in pass-and-play
// multiplayer, so the device handoff is unambiguous instead of a player
// accidentally seeing (or tapping through) the previous player's reveal.
export function HandoffScreen({ nextPlayerName, timeline, onContinue }: Props) {
  return (
    <div className="handoff-overlay">
      <div className="handoff-screen">
        <p className="handoff-label">Passing to</p>
        <h2 className="handoff-name">{nextPlayerName}</h2>
        {timeline.length === 0 ? (
          <p className="empty-timeline">No cards placed yet.</p>
        ) : (
          <div className="handoff-preview-track">
            {timeline.map((c) => (
              <div key={c.song.id} className="handoff-preview-card">
                {c.song.year}
              </div>
            ))}
          </div>
        )}
        <button type="button" className="pill-btn primary handoff-continue-btn" onClick={onContinue}>
          Hand over device
        </button>
      </div>
    </div>
  );
}
