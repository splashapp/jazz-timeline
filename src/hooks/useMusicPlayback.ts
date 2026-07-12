import { useEffect, useRef, useState } from "react";
import type { GameState, MediaService, Song } from "../types/game";
import type { GameAction } from "../state/gameReducer";
import { pickRandomSong } from "../state/gameReducer";
import { YouTubeMusicService } from "../services/youtubeService";
import { MockMusicService } from "../services/mockMusicService";
import type { MusicService } from "../services/musicService";
import { logVideoIdIssue } from "../utils/adminLog";

// Owns the actual player instance and all playback state, used once at the
// App level (not inside GameScreen) so the player already exists — and can
// be prefetching/cueing the very first song — while the player is still on
// the splash/setup screens. That's what lets "Play Solo"/"Start Game" call
// playVideoId() synchronously within their own click, the same way "Next"
// does for every later turn: no button dedicated to starting playback is
// ever needed, only genuine clicks that were already happening anyway.
export function useMusicPlayback(
  mediaService: MediaService,
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
) {
  const serviceRef = useRef<MusicService | null>(null);
  const videoCacheRef = useRef<Map<string, string>>(new Map());
  // Whichever song is prepared to play next: the first song while still on
  // the splash/setup screens, or the upcoming turn's song once mid-game.
  const preparedRef = useRef<{ song: Song; videoId: string } | null>(null);
  const lastAttemptRef = useRef<Song | null>(null);
  const retriedSongIdsRef = useRef<Set<string>>(new Set());
  // Guards the auto-start-on-"ready" effect below against firing twice for
  // the same turn — both React StrictMode's dev-mode double-invoke and the
  // effect's own dependency list can otherwise trigger it more than once
  // before the DRAW_SONG dispatch has had a chance to move turnPhase on.
  const autoStartLockRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getKnownVideoId = (song: Song): string | undefined =>
    videoCacheRef.current.get(song.id) ?? song.videoId;

  useEffect(() => {
    const service =
      mediaService === "mock" ? new MockMusicService() : new YouTubeMusicService("youtube-player-container");
    service.onPlaybackBlocked(setPlaybackBlocked);
    service.onPlayStateChange(setIsPlaying);
    service.onPlaybackError(() => {
      const song = lastAttemptRef.current;
      if (!song || retriedSongIdsRef.current.has(song.id)) return;
      retriedSongIdsRef.current.add(song.id);
      logVideoIdIssue(song, "stale");
      serviceRef.current
        ?.loadAndPlay(song)
        .then((videoId) => videoCacheRef.current.set(song.id, videoId))
        .catch((e: Error) => setError(e.message));
    });
    serviceRef.current = service;
    preparedRef.current = null;
    // React StrictMode double-invokes this effect in dev (mount -> cleanup
    // -> mount). Without tearing the first instance's player down, both
    // would race to create a YT.Player on the same DOM node, and one can
    // hang forever waiting for onReady that never fires.
    return () => {
      service.destroy();
    };
  }, [mediaService]);

  // Keeps one song prepared ahead at all times — the first song while idle
  // on splash/setup, the next turn's song once mid-game — and, only once
  // the game has actually started and a turn is waiting to begin, uses it
  // to start that turn's playback automatically.
  useEffect(() => {
    if (!serviceRef.current) return;
    const startsNow = state.phase === "playing" && state.turnPhase === "ready";
    if (startsNow) {
      if (autoStartLockRef.current) return;
      autoStartLockRef.current = true;
    } else {
      autoStartLockRef.current = false;
    }
    const song = pickRandomSong(state.usedSongIds);
    if (!song) {
      preparedRef.current = null;
      if (startsNow) dispatch({ type: "DRAW_SONG", song: null });
      return;
    }

    const startPlayback = (videoId: string) => {
      videoCacheRef.current.set(song.id, videoId);
      lastAttemptRef.current = song;
      dispatch({ type: "DRAW_SONG", song });
      serviceRef.current?.playVideoId(videoId);
    };

    const known = getKnownVideoId(song);
    if (known) {
      if (startsNow) {
        setLoading(false);
        startPlayback(known);
      } else {
        preparedRef.current = { song, videoId: known };
        serviceRef.current.cueVideoId(known);
      }
      return;
    }

    let cancelled = false;
    if (startsNow) {
      setError(null);
      setLoading(true);
    }
    serviceRef.current
      .init()
      .then(() => serviceRef.current!.resolveVideoId(song.searchQuery))
      .then((videoId) => {
        if (cancelled || !videoId) return;
        videoCacheRef.current.set(song.id, videoId);
        if (startsNow) {
          startPlayback(videoId);
        } else {
          preparedRef.current = { song, videoId };
          serviceRef.current?.cueVideoId(videoId);
        }
      })
      .catch((e: Error) => {
        if (startsNow && !cancelled) setError(e.message);
      })
      .finally(() => {
        if (startsNow && !cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.usedSongIds, state.turnPhase]);

  useEffect(() => {
    if (state.turnPhase !== "revealed") setNowPlaying(null);
  }, [state.turnPhase]);

  // Called directly from the "Play Solo"/"Start Game" click, i.e. the very
  // first genuine user gesture in the whole app — synchronous, so it works
  // even though the player was created moments earlier by an effect, not by
  // this click itself. Dispatches DRAW_SONG itself; caller still dispatches
  // START_GAME (order doesn't matter, both land in the same click).
  const playFirstSongSync = (): void => {
    const prepared = preparedRef.current;
    const song = prepared?.song ?? pickRandomSong([]);
    preparedRef.current = null;
    if (!song) return;

    const knownId = prepared?.videoId ?? getKnownVideoId(song);
    if (knownId) {
      setLoading(false);
      videoCacheRef.current.set(song.id, knownId);
      lastAttemptRef.current = song;
      serviceRef.current?.playVideoId(knownId);
    } else {
      setLoading(true);
      lastAttemptRef.current = song;
      logVideoIdIssue(song, "missing");
      serviceRef.current
        ?.loadAndPlay(song)
        .then((videoId) => videoCacheRef.current.set(song.id, videoId))
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    }
    dispatch({ type: "DRAW_SONG", song });
  };

  const handleReplay = (song: Song) => {
    // Stop whatever is currently playing first so a slow/failed load for the
    // clicked song can never be mistaken for "the old song kept playing".
    serviceRef.current?.stop();
    setError(null);
    setPlaybackBlocked(false);
    setNowPlaying(song);
    lastAttemptRef.current = song;
    const knownId = getKnownVideoId(song);
    if (knownId) {
      serviceRef.current?.playVideoId(knownId);
    } else {
      logVideoIdIssue(song, "missing");
      serviceRef.current
        ?.loadAndPlay(song)
        .then((videoId) => videoCacheRef.current.set(song.id, videoId))
        .catch((e: Error) => setError(e.message));
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      serviceRef.current?.pause();
    } else {
      serviceRef.current?.play();
    }
  };

  const handleNext = () => {
    serviceRef.current?.stop();
    setNowPlaying(null);
    setError(null);
    setPlaybackBlocked(false);

    const prepared = preparedRef.current;
    const song = prepared?.song ?? pickRandomSong(state.usedSongIds);
    preparedRef.current = null;

    if (song) {
      const knownId = prepared?.videoId ?? getKnownVideoId(song);
      if (knownId) {
        setLoading(false);
        videoCacheRef.current.set(song.id, knownId);
        lastAttemptRef.current = song;
        // Synchronous, within this click — the reliable path.
        serviceRef.current?.playVideoId(knownId);
      } else {
        setLoading(true);
        lastAttemptRef.current = song;
        logVideoIdIssue(song, "missing");
        serviceRef.current
          ?.loadAndPlay(song)
          .then((videoId) => videoCacheRef.current.set(song.id, videoId))
          .catch((e: Error) => setError(e.message))
          .finally(() => setLoading(false));
      }
    }

    dispatch({ type: "NEXT_TURN", song });
  };

  return {
    error,
    loading,
    playbackBlocked,
    nowPlaying,
    isPlaying,
    playFirstSongSync,
    handleReplay,
    handleTogglePlay,
    handleNext,
  };
}
