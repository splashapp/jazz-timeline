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
  cueVideoById(videoId: string): void;
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  unMute(): void;
  setVolume(volume: number): void;
  destroy(): void;
}

const YT_STATE_PLAYING = 1;

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
  private playStateCb: ((isPlaying: boolean) => void) | null = null;
  private errorCb: (() => void) | null = null;
  private destroyed = false;

  constructor(containerId: string) {
    this.containerId = containerId;
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

  private handleStateChange(state: number): void {
    this.playStateCb?.(state === YT_STATE_PLAYING);
  }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      await loadYouTubeApi();
      // Loading the iframe API script is a real network round-trip, so a
      // destroy() (e.g. React StrictMode's dev-mode double-invoke cleanup)
      // can land while we're still waiting for it — bail out before
      // creating a player that would target a DOM node another instance
      // may already be using, instead of just destroying a player that
      // doesn't exist yet.
      if (this.destroyed) return;
      await new Promise<void>((resolve) => {
        // A literally 0x0 iframe forcing audio matches a known ad/abuse
        // pattern some browsers guard against by silently muting it — a
        // small non-zero size (still hidden off-screen via CSS, see
        // .yt-hidden) avoids that heuristic while staying invisible.
        this.player = new window.YT!.Player(this.containerId, {
          height: "2",
          width: "2",
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

  // Loads a video without playing it, so it's already buffered by the time
  // the explicit Play button is actually clicked.
  cueVideoId(videoId: string): void {
    this.player?.cueVideoById(videoId);
  }

  // Called directly from the "Play Song" button's click handler — a real
  // user gesture, so iOS Safari's autoplay restrictions are simply never in
  // play here; no blocked-detection/retry timers needed.
  playVideoId(videoId: string): void {
    if (!this.player) return;
    // Reset whatever was previously loaded/playing before starting the new
    // one, so there's no chance of the old and new videos briefly overlapping.
    this.player.stopVideo();
    this.player.loadVideoById(videoId);
    // Some browsers silently mute autoplaying embeds as a fallback instead
    // of blocking them outright — the player then reports PLAYING with no
    // audible sound. Force unmuted + full volume on every attempt so that
    // can't happen (harmless no-op if it was never muted).
    this.player.unMute();
    this.player.setVolume(100);
    this.player.playVideo();
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
    this.player?.unMute();
    this.player?.setVolume(100);
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  stop(): void {
    this.playStateCb?.(false);
    this.player?.stopVideo();
  }

  // Tears down the underlying iframe/player entirely. Needed because React
  // StrictMode double-invokes effects in dev (mount -> cleanup -> mount) —
  // without this, the first "mount" could leave behind a player instance
  // still racing to initialize against the same DOM node as the second,
  // and one of them would never fire onReady, hanging init() forever.
  destroy(): void {
    this.destroyed = true;
    this.player?.destroy();
    this.player = null;
  }
}
