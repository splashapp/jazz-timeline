import { useEffect, useMemo, useRef, useState } from "react";
import type { GameState } from "../types/game";
import type { GameAction } from "../state/gameReducer";
import { JOKER_MIN_CORRIDOR } from "../state/gameReducer";
import type { useMusicPlayback } from "../hooks/useMusicPlayback";
import { boundsFor } from "../utils/placement";
import { pickArtistOptions } from "../utils/joker";
import { Timeline, type TimelineHandle } from "./Timeline";
import { TurnCard } from "./TurnCard";
import { YearCorridor } from "./YearCorridor";
import { JokerDialog } from "./JokerDialog";
import { HandoffScreen } from "./HandoffScreen";

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  music: ReturnType<typeof useMusicPlayback>;
}

// How long the "still at the wrong slot" preview holds before the card
// visibly slides into its true chronological position (Scene 10) — timed
// to land after the flip (0.75s) + odometer roll (0.7s) have settled.
const SLIDE_SETTLE_DELAY_MS = 1400;

export function GameScreen({ state, dispatch, music }: Props) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const timelineRef = useRef<TimelineHandle>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showHandoff, setShowHandoff] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  // The gap index chosen during the placement drag — captured locally so
  // the reveal can briefly show the card at that (possibly wrong) slot
  // before sliding it to its true position; the reducer clears its own
  // copy the moment the turn is finalized.
  const lastChosenIndexRef = useRef<number | null>(null);

  const placedCard =
    state.turnPhase === "revealed" && state.currentSong
      ? currentPlayer?.timeline.find((c) => c.song.id === state.currentSong!.id)
      : undefined;

  useEffect(() => {
    if (state.turnPhase === "revealed" && placedCard && !placedCard.correctPlacement) {
      setPreviewActive(true);
      const t = setTimeout(() => setPreviewActive(false), SLIDE_SETTLE_DELAY_MS);
      return () => clearTimeout(t);
    }
    setPreviewActive(false);
  }, [state.turnPhase, placedCard]);

  const artistOptions = useMemo(
    () => (state.currentSong ? pickArtistOptions(state.currentSong.artist) : []),
    [state.currentSong],
  );

  if (!currentPlayer) return null;
  const isSolo = state.players.length === 1;

  const settlingId =
    state.turnPhase === "revealed" && placedCard && !placedCard.correctPlacement
      ? placedCard.song.id
      : null;

  const displayTimeline =
    previewActive && placedCard && lastChosenIndexRef.current !== null
      ? (() => {
          const withoutPlaced = currentPlayer.timeline.filter((c) => c.song.id !== placedCard.song.id);
          const idx = Math.min(lastChosenIndexRef.current, withoutPlaced.length);
          const copy = [...withoutPlaced];
          copy.splice(idx, 0, placedCard);
          return copy;
        })()
      : currentPlayer.timeline;

  const corridor =
    (state.turnPhase === "guessing-year" || state.turnPhase === "joker") &&
    state.pendingPlacementIndex !== null
      ? boundsFor(currentPlayer.timeline, state.pendingPlacementIndex)
      : null;

  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const nextPlayer = state.players[nextIndex];

  const goToNextTurn = () => {
    lastChosenIndexRef.current = null;
    music.handleNext();
  };

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
        timelineRef={timelineRef}
        onCommitPlacement={(index) => {
          lastChosenIndexRef.current = index;
          setHoveredIndex(null);
          dispatch({ type: "LOCK_PLACEMENT", index });
        }}
        onHoverChange={setHoveredIndex}
        onPlaySong={music.handlePlaySong}
        onTogglePlay={music.handleTogglePlay}
        onNext={() => {
          if (isSolo) {
            goToNextTurn();
          } else {
            setShowHandoff(true);
          }
        }}
        nextLabel={isSolo ? "Next" : "Next Player"}
        playerName={isSolo ? currentPlayer.name : `${currentPlayer.name}'s turn`}
        roundLabel={`Card ${currentPlayer.timeline.length + 1} / ${state.roundsPerPlayer}`}
      />

      <div className="timeline-dock">
        {state.turnPhase === "guessing-year" && corridor ? (
          <YearCorridor
            min={corridor.min}
            max={corridor.max}
            onCommit={(yearGuess) => dispatch({ type: "GUESS_YEAR", yearGuess })}
          />
        ) : state.turnPhase === "joker" && corridor ? (
          <JokerDialog
            jokersRemaining={currentPlayer.jokersRemaining}
            yearEligible={corridor.max - corridor.min > JOKER_MIN_CORRIDOR}
            artistOptions={artistOptions}
            onUseYear={() => dispatch({ type: "USE_JOKER", jokerType: "year" })}
            onUseArtist={(artistGuess) => dispatch({ type: "USE_JOKER", jokerType: "artist", artistGuess })}
            onSkip={() => dispatch({ type: "SKIP_JOKER" })}
          />
        ) : (
          <Timeline
            ref={timelineRef}
            timeline={displayTimeline}
            hoveredIndex={hoveredIndex}
            interactive={state.turnPhase === "listening" && music.isPlaying}
            settlingId={settlingId}
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

      {showHandoff && nextPlayer && (
        <HandoffScreen
          nextPlayerName={nextPlayer.name}
          timeline={nextPlayer.timeline}
          onContinue={() => {
            setShowHandoff(false);
            goToNextTurn();
          }}
        />
      )}
    </div>
  );
}
