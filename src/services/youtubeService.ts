import type { MusicService } from "./musicService";
import type { Song } from "../types/game";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: string,
        options: {
          height: string;
          width: string;
          playerVars?: Record<string, number>;
          events?: {
            onReady?: () => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: () => void;
          };
        },
      ) => YouTubePlayer;
    };
  }
}

interface YouTubePlayer {
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
}

const YT_STATE_PLAYING = 1;

// iOS Safari blocks autoplay unless playVideo() is triggered directly by a
// user gesture. Because loadAndPlay() awaits a network search first, the
// gesture context is lost by the time playVideo() runs, so playback silently
// fails to start. This timeout detects that case so the UI can offer a
// manual "tap to play" fallback that calls play() synchronously.
const PLAYBACK_BLOCKED_TIMEOUT_MS = 1200;

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiLoadPromise;
}

export class YouTubeMusicService implements MusicService {
  private player: YouTubePlayer | null = null;
  private containerId: string;
  private initPromise: Promise<void> | null = null;
  private blockedCb: ((blocked: boolean) => void) | null = null;
  private blockedTimer: number | null = null;
  private playStateCb: ((isPlaying: boolean) => void) | null = null;
  private errorCb: (() => void) | null = null;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  onPlaybackBlocked(cb: (blocked: boolean) => void): void {
    this.blockedCb = cb;
  }

  onPlayStateChange(cb: (isPlaying: boolean) => void): void {
    this.playStateCb = cb;
  }

  // Fires when the currently loaded video can't be played (removed, made
  // private, embedding disabled, etc). A stored videoId in songs.json can go
  // stale like this over time, so callers use this to fall back to a fresh
  // search for the same song.
  onPlaybackError(cb: () => void): void {
    this.errorCb = cb;
  }

  private clearBlockedTimer(): void {
    if (this.blockedTimer !== null) {
      window.clearTimeout(this.blockedTimer);
      this.blockedTimer = null;
    }
  }

  private handleStateChange(state: number): void {
    this.playStateCb?.(state === YT_STATE_PLAYING);
    if (state === YT_STATE_PLAYING) {
      this.clearBlockedTimer();
      this.blockedCb?.(false);
    }
  }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      await loadYouTubeApi();
      await new Promise<void>((resolve) => {
        this.player = new window.YT!.Player(this.containerId, {
          height: "0",
          width: "0",
          playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
          events: {
            onReady: () => resolve(),
            onStateChange: (event) => this.handleStateChange(event.data),
            onError: () => this.errorCb?.(),
          },
        });
      });
    })();
    return this.initPromise;
  }

  async resolveVideoId(query: string): Promise<string | null> {
    if (!API_KEY) {
      throw new Error(
        "No YouTube API key configured. Please set VITE_YOUTUBE_API_KEY in the .env file (see README).",
      );
    }
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("videoCategoryId", "10");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("key", API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`YouTube search failed (status ${res.status}).`);
    }
    const data = await res.json();
    return data.items?.[0]?.id?.videoId ?? null;
  }

  // Synchronous on purpose: this must be callable directly from a click
  // handler (no awaits before it) so iOS Safari treats it as a genuine
  // user-gesture-triggered play, e.g. for a cached/prefetched video id.
  playVideoId(videoId: string): void {
    if (!this.player) return;
    this.player.loadVideoById(videoId);
    this.player.playVideo();

    this.clearBlockedTimer();
    this.blockedTimer = window.setTimeout(() => {
      this.blockedCb?.(true);
    }, PLAYBACK_BLOCKED_TIMEOUT_MS);
  }

  async loadAndPlay(song: Song): Promise<string> {
    await this.init();
    const videoId = await this.resolveVideoId(song.searchQuery);
    if (!videoId) {
      throw new Error(`No YouTube video found for "${song.searchQuery}".`);
    }
    this.playVideoId(videoId);
    return videoId;
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  stop(): void {
    this.clearBlockedTimer();
    this.blockedCb?.(false);
    this.playStateCb?.(false);
    this.player?.stopVideo();
  }
}
