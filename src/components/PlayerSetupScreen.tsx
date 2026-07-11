import { useState } from "react";

interface Props {
  onStart: (names: string[]) => void;
}

export function PlayerSetupScreen({ onStart }: Props) {
  const [count, setCount] = useState(1);
  const [names, setNames] = useState<string[]>(["Player 1"]);

  function setCountAndResize(n: number) {
    const clamped = Math.min(8, Math.max(1, n));
    setCount(clamped);
    setNames((prev) => {
      const next = [...prev];
      while (next.length < clamped) next.push(`Player ${next.length + 1}`);
      return next.slice(0, clamped);
    });
  }

  function updateName(i: number, value: string) {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }

  const validNames = names.map((n) => n.trim()).filter((n) => n.length > 0);

  return (
    <div className="screen player-setup">
      <h1>Who's Playing?</h1>
      <div className="field">
        <span className="field-label">Number of Players</span>
        <div className="count-chips">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              type="button"
              className={`count-chip${count === n ? " active" : ""}`}
              onClick={() => setCountAndResize(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
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
