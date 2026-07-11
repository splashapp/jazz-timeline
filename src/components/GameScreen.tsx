import { useEffect, useRef, useState } from "react";
import type { GameState } from "../types/game";
import type { GameAction } from "../state/gameReducer";
import { Timeline } from "./Timeline";
import { GuessForm } from "./GuessForm";
import { TurnCard } from "./TurnCard";
import { YouTubeMusicService } from "../services/youtubeService";
import type { MusicService } from "../services/musicService";

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function GameScreen({ state, dispatch }: Props) {
  const serviceRef = useRef<MusicService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.mediaService === "youtube" && !serviceRef.current) {
      serviceRef.current = new YouTubeMusicService("youtube-player-container");
    }
  }, [state.mediaService]);

  useEffect(() => {
    if (state.turnPhase !== "listening" || !state.currentSong || !serviceRef.current) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    serviceRef.current
      .loadAndPlay(state.currentSong)
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.turnPhase, state.currentSong]);

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) return null;
  const isSolo = state.players.length === 1;

  const placedCard =
    state.turnPhase === "revealed" && state.currentSong
      ? currentPlayer.timeline.find((c) => c.song.id === state.currentSong!.id)
      : undefined;

  return (
    <div className="screen game-screen">
      <div id="youtube-player-container" className="yt-hidden" />

      <TurnCard
        turnPhase={state.turnPhase}
        currentSong={state.currentSong}
        placedCard={placedCard}
        loading={loading}
        error={error}
        onPlay={() => dispatch({ type: "DRAW_SONG" })}
        onNext={() => dispatch({ type: "NEXT_TURN" })}
        nextLabel={isSolo ? "Weiter" : "Nächster Spieler"}
        playerName={isSolo ? currentPlayer.name : `${currentPlayer.name} ist dran`}
        roundLabel={`Karte ${currentPlayer.timeline.length + 1} / ${state.roundsPerPlayer}`}
      />

      <div className="timeline-dock">
        {state.turnPhase === "listening" ? (
          <Timeline
            timeline={currentPlayer.timeline}
            placementMode
            onPlace={(index) => dispatch({ type: "PLACE_CARD", index })}
          />
        ) : (
          <Timeline timeline={currentPlayer.timeline} placementMode={false} />
        )}
      </div>

      {isSolo ? (
        <p className="score-line">
          Punktestand:{" "}
          <span key={currentPlayer.score} className="score-pop">
            {currentPlayer.score} Pkt
          </span>
        </p>
      ) : (
        <div className="scoreboard">
          {state.players.map((p) => (
            <div key={p.id} className={p.id === currentPlayer.id ? "score-item active" : "score-item"}>
              <span>{p.name}</span>
              <span key={p.score} className="score-pop">
                {p.score} Pkt
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
