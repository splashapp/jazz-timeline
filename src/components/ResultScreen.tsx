import type { GameState } from "../types/game";

interface Props {
  state: GameState;
  onRestart: () => void;
}

export function ResultScreen({ state, onRestart }: Props) {
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const isSolo = state.players.length === 1;

  return (
    <div className="screen result-screen">
      <span className="eyebrow-tag">Aufgelegt</span>
      <h1>Spiel beendet</h1>

      <div className="result-disc">
        <div className="vinyl">
          <span className="vinyl-label" />
        </div>
      </div>

      {isSolo && winner && <p className="winner">Du hast {winner.score} Punkte erzielt!</p>}
      {!isSolo && winner && (
        <p className="winner">🏆 {winner.name} gewinnt mit {winner.score} Punkten!</p>
      )}
      {!isSolo && (
        <ol className="final-scores">
          {sorted.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <span>{p.score} Punkte</span>
            </li>
          ))}
        </ol>
      )}
      <button className="pill-btn primary" onClick={onRestart}>
        Neues Spiel
      </button>
    </div>
  );
}
