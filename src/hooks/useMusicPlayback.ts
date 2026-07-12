import { useEffect, useRef, useState } from "react";
import type { GameState, MediaService, Song } from "../types/game";
import type { GameAction } from "../state/gameReducer";
import { YouTubeMusicService } from "../services/youtubeService";
import { MockMusicService } from "../services/mockMusicService";
import type { MusicService } from "../services/musicService";
import { logVideoIdIssue } from "../utils/adminLog";

// Simple, original flow: whenever the reducer draws a new song, resolve its
// video ("Searching…" in the UI meanwhile), then wait for the player to
// explicitly click "Play Song" — that click is the real user gesture, so
// there's no need for synchronous-play-on-a-different-click choreography or
// autoplay-blocked detection/retry timers, both of which were the source of
// repeated timing bugs.
export function useMusicPlayback(
  mediaService: MediaService,
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
) {
  const serviceRef = useRef<MusicService | null>(null);
  const videoCacheRef = useRef<Map<string, string>>(new Map());
  // Which song.id has already been resolved + cued, so the resolve effect
  // below doesn't redo that work on every turnPhase change (guessing,
  // revealed) — only an actual new currentSong should trigger it again.
  const resolvedForSongIdRef = useRef<string | null>(null);
  const lastAttemptRef = useRef<Song | null>(null);
  const retriedSongIdsRef = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [songReady, setSongReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getKnownVideoId = (song: Song): string | undefined =>
    videoCacheRef.current.get(song.id) ?? song.videoId;

  useEffect(() => {
    const service =
      mediaService === "mock" ? new MockMusicService() : new YouTubeMusicService("youtube-player-container");
    service.onPlayStateChange(setIsPlaying);
    service.onPlaybackError(() => {
      const song = lastAttemptRef.current;
      if (!song || retriedSongIdsRef.current.has(song.id)) return;
      retriedSongIdsRef.current.add(song.id);
      logVideoIdIssue(song, "stale");
      resolvedForSongIdRef.current = null;
      setSongReady(false);
      serviceRef.current
        ?.resolveVideoId(song.searchQuery)
        .then((videoId) => {
          if (!videoId) throw new Error(`No YouTube video found for "${song.searchQuery}".`);
          videoCacheRef.current.set(song.id, videoId);
          serviceRef.current?.cueVideoId(videoId);
          resolvedForSongIdRef.current = song.id;
          setSongReady(true);
        })
        .catch((e: Error) => setError(e.message));
    });
    serviceRef.current = service;
    resolvedForSongIdRef.current = null;
    // React StrictMode double-invokes this effect in dev (mount -> cleanup
    // -> mount). Without tearing the first instance's player down, both
    // would race to create a YT.Player on the same DOM node, and one can
    // hang forever waiting for onReady that never fires.
    return () => {
      service.destroy();
    };
  }, [mediaService]);

  // Resolves + cues the current turn's song. Runs only when currentSong
  // actually changes (a new turn started) — turnPhase moving on within the
  // same turn (listening -> guessing -> revealed) doesn't touch this at all,
  // so playback is never interrupted by anything other than "Next".
  useEffect(() => {
    if (!serviceRef.current) return;
    const song = state.currentSong;
    if (!song || resolvedForSongIdRef.current === song.id) return;

    setError(null);
    setSongReady(false);
    setStarting(false);
    let cancelled = false;

    const markReady = (videoId: string) => {
      videoCacheRef.current.set(song.id, videoId);
      serviceRef.current?.cueVideoId(videoId);
      resolvedForSongIdRef.current = song.id;
      setSongReady(true);
    };

    const known = getKnownVideoId(song);
    if (known) {
      markReady(known);
      return;
    }

    serviceRef.current
      .init()
      .then(() => serviceRef.current!.resolveVideoId(song.searchQuery))
      .then((videoId) => {
        if (cancelled) return;
        if (!videoId) throw new Error(`No YouTube video found for "${song.searchQuery}".`);
        markReady(videoId);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [state.currentSong]);

  useEffect(() => {
    if (state.turnPhase !== "revealed") setNowPlaying(null);
  }, [state.turnPhase]);

  useEffect(() => {
    if (isPlaying) setStarting(false);
  }, [isPlaying]);

  // The actual "Play Song" button handler — a genuine, direct user gesture,
  // called only once songReady is true, so this always works.
  const handlePlaySong = () => {
    const song = state.currentSong;
    if (!song) return;
    const videoId = getKnownVideoId(song);
    if (!videoId) return;
    setStarting(true);
    lastAttemptRef.current = song;
    serviceRef.current?.playVideoId(videoId);
  };

  const handleReplay = (song: Song) => {
    // Stop whatever is currently playing first so a slow/failed load for the
    // clicked song can never be mistaken for "the old song kept playing".
    serviceRef.current?.stop();
    setError(null);
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
    dispatch({ type: "NEXT_TURN" });
  };

  return {
    error,
    songReady,
    starting,
    nowPlaying,
    isPlaying,
    handlePlaySong,
    handleReplay,
    handleTogglePlay,
    handleNext,
  };
}
