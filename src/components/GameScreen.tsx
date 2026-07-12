import type { GameState } from "../types/game";
import type { GameAction } from "../state/gameReducer";
import type { useMusicPlayback } from "../hooks/useMusicPlayback";
import { Timeline } from "./Timeline";
import { GuessForm } from "./GuessForm";
import { TurnCard } from "./TurnCard";

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  music: ReturnType<typeof useMusicPlayback>;
}

export function GameScreen({ state, dispatch, music }: Props) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) return null;
  const isSolo = state.players.length === 1;

  const placedCard =
    state.turnPhase === "revealed" && state.currentSong
      ? currentPlayer.timeline.find((c) => c.song.id === state.currentSong!.id)
      : undefined;

  return (
    <div className="screen game-screen">
      <TurnCard
        turnPhase={state.turnPhase}
        currentSong={state.currentSong}
        placedCard={placedCard}
        songReady={music.songReady}
        starting={music.starting}
        error={music.error}
        nowPlaying={music.nowPlaying}
        isPlaying={music.isPlaying}
        onPlaySong={music.handlePlaySong}
        onTogglePlay={music.handleTogglePlay}
        onNext={music.handleNext}
        nextLabel={isSolo ? "Next" : "Next Player"}
        playerName={isSolo ? currentPlayer.name : `${currentPlayer.name}'s turn`}
        roundLabel={`Card ${currentPlayer.timeline.length + 1} / ${state.roundsPerPlayer}`}
      />

      <div className="timeline-dock">
        {state.turnPhase === "listening" ? (
          <Timeline
            timeline={currentPlayer.timeline}
            placementMode
            onPlace={(index) => dispatch({ type: "PLACE_CARD", index })}
          />
        ) : (
          <Timeline
            timeline={currentPlayer.timeline}
            placementMode={false}
            onCardClick={state.turnPhase === "revealed" ? music.handleReplay : undefined}
          />
        )}
      </div>

      {isSolo ? (
        <p className="score-line">
          Score:{" "}
          <span key={currentPlayer.score} className="score-pop">
            {currentPlayer.score} pts
          </span>
        </p>
      ) : (
        <div className="scoreboard">
          {state.players.map((p) => (
            <div key={p.id} className={p.id === currentPlayer.id ? "score-item active" : "score-item"}>
              <span>{p.name}</span>
              <span key={p.score} className="score-pop">
                {p.score} pts
              </span>
            </div>
          ))}
        </div>
      )}

      {state.turnPhase === "guessing" && (
        <div className="guess-sheet-backdrop">
          <GuessForm
            genreEnabled={state.genreFeatureEnabled}
            onSubmit={(yearGuess, artistGuess, genreGuess) =>
              dispatch({ type: "REVEAL", yearGuess, artistGuess, genreGuess })
            }
          />
        </div>
      )}
    </div>
  );
}
