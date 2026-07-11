import { useEffect, useRef, useState } from "react";
import type { GameState, Song } from "../types/game";
import type { GameAction } from "../state/gameReducer";
import { pickRandomSong } from "../state/gameReducer";
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
  const videoCacheRef = useRef<Map<string, string>>(new Map());
  const preparedRef = useRef<{ song: Song; videoId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);

  useEffect(() => {
    if (state.mediaService === "youtube" && !serviceRef.current) {
      const service = new YouTubeMusicService("youtube-player-container");
      service.onPlaybackBlocked(setPlaybackBlocked);
      serviceRef.current = service;
    }
  }, [state.mediaService]);

  // Prefetch the next song's video id while the card is idle, so the actual
  // "Play Song" tap can call playVideoId() synchronously (required for
  // autoplay on iOS Safari) instead of waiting on a network search first.
  useEffect(() => {
    if (state.turnPhase !== "ready" || !serviceRef.current) return;
    preparedRef.current = null;
    const song = pickRandomSong(state.usedSongIds);
    if (!song) return;
    const cached = videoCacheRef.current.get(song.id);
    if (cached) {
      preparedRef.current = { song, videoId: cached };
      return;
    }
    let cancelled = false;
    serviceRef.current
      .init()
      .then(() => serviceRef.current!.resolveVideoId(song.searchQuery))
      .then((videoId) => {
        if (cancelled || !videoId) return;
        videoCacheRef.current.set(song.id, videoId);
        preparedRef.current = { song, videoId };
      })
      .catch(() => {
        // Ignore prefetch failures; the actual play click falls back to the
        // regular async loadAndPlay path and surfaces errors there.
      });
    return () => {
      cancelled = true;
    };
  }, [state.turnPhase, state.usedSongIds]);

  useEffect(() => {
    if (state.turnPhase !== "revealed") setNowPlaying(null);
  }, [state.turnPhase]);

  const handlePlay = () => {
    const prepared = preparedRef.current;
    const song = prepared?.song ?? pickRandomSong(state.usedSongIds);
    setError(null);
    setPlaybackBlocked(false);
    dispatch({ type: "DRAW_SONG", song });
    if (!song) return;

    if (prepared) {
      setLoading(false);
      serviceRef.current?.playVideoId(prepared.videoId);
    } else {
      setLoading(true);
      serviceRef.current
        ?.loadAndPlay(song)
        .then((videoId) => videoCacheRef.current.set(song.id, videoId))
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    }
  };

  const handleReplay = (song: Song) => {
    setError(null);
    setPlaybackBlocked(false);
    setNowPlaying(song);
    const cached = videoCacheRef.current.get(song.id);
    if (cached) {
      serviceRef.current?.playVideoId(cached);
    } else {
      serviceRef.current
        ?.loadAndPlay(song)
        .then((videoId) => videoCacheRef.current.set(song.id, videoId))
        .catch((e: Error) => setError(e.message));
    }
  };

  const handleManualPlay = () => {
    serviceRef.current?.play();
    setPlaybackBlocked(false);
  };

  const handleNext = () => {
    serviceRef.current?.stop();
    setNowPlaying(null);
    dispatch({ type: "NEXT_TURN" });
  };

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
        playbackBlocked={playbackBlocked}
        nowPlaying={nowPlaying}
        onManualPlay={handleManualPlay}
        onPlay={handlePlay}
        onNext={handleNext}
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
            onCardClick={state.turnPhase === "revealed" ? handleReplay : undefined}
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
