import { useState } from "react";

interface Props {
  onBack: () => void;
  onStart: (names: string[]) => void;
}

const MAX_PLAYERS = 8;

export function PlayerSetupScreen({ onBack, onStart }: Props) {
  const [names, setNames] = useState<string[]>(["Player 1", "Player 2"]);

  function updateName(i: number, value: string) {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }

  function addPlayer() {
    setNames((prev) =>
      prev.length >= MAX_PLAYERS ? prev : [...prev, `Player ${prev.length + 1}`],
    );
  }

  const validNames = names.map((n) => n.trim()).filter((n) => n.length > 0);

  return (
    <div className="screen player-setup">
      <button className="back-btn" onClick={onBack} aria-label="Back">
        ← Back
      </button>
      <h1>Who's Playing?</h1>
      <div className="player-names">
        {names.map((name, i) => (
          <input
            key={i}
            value={name}
            onChange={(e) => updateName(i, e.target.value)}
            placeholder={`Player ${i + 1}`}
          />
        ))}
      </div>
      {names.length < MAX_PLAYERS && (
        <button className="link-btn" onClick={addPlayer}>
          + Add Player
        </button>
      )}
      <button
        className="pill-btn primary"
        onClick={() => onStart(validNames)}
        disabled={validNames.length < 1}
      >
        Start Game
      </button>
    </div>
  );
}
