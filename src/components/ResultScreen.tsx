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
      <span className="eyebrow-tag">Spun</span>
      <h1>Game Over</h1>

      <div className="result-disc">
        <div className="vinyl">
          <span className="vinyl-label" />
        </div>
        <div className="vinyl-sheen" />
      </div>

      {isSolo && winner && <p className="winner">You scored {winner.score} points!</p>}
      {!isSolo && winner && (
        <p className="winner">🏆 {winner.name} wins with {winner.score} points!</p>
      )}
      {!isSolo && (
        <ol className="final-scores">
          {sorted.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <span>{p.score} points</span>
            </li>
          ))}
        </ol>
      )}
      <button className="pill-btn primary" onClick={onRestart}>
        New Game
      </button>
    </div>
  );
}
