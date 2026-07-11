import { useState } from "react";

interface Props {
  onStart: (names: string[]) => void;
}

export function PlayerSetupScreen({ onStart }: Props) {
  const [count, setCount] = useState(1);
  const [names, setNames] = useState<string[]>(["Spieler 1"]);

  function setCountAndResize(n: number) {
    const clamped = Math.min(8, Math.max(1, n));
    setCount(clamped);
    setNames((prev) => {
      const next = [...prev];
      while (next.length < clamped) next.push(`Spieler ${next.length + 1}`);
      return next.slice(0, clamped);
    });
  }

  function updateName(i: number, value: string) {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }

  const validNames = names.map((n) => n.trim()).filter((n) => n.length > 0);

  return (
    <div className="screen player-setup">
      <span className="eyebrow-tag">Schritt 2</span>
      <h1>Wer spielt mit?</h1>
      <label className="field">
        Anzahl Spieler
        <input
          type="number"
          min={1}
          max={8}
          value={count}
          onChange={(e) => setCountAndResize(Number(e.target.value))}
        />
      </label>
      <div className="player-names">
        {names.map((name, i) => (
          <input
            key={i}
            value={name}
            onChange={(e) => updateName(i, e.target.value)}
            placeholder={`Spieler ${i + 1}`}
          />
        ))}
      </div>
      <button
        className="pill-btn primary"
        onClick={() => onStart(validNames)}
        disabled={validNames.length < 1}
      >
        Spiel starten
      </button>
    </div>
  );
}
