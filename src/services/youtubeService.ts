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
          events?: { onReady?: () => void };
        },
      ) => YouTubePlayer;
    };
  }
}

interface YouTubePlayer {
  loadVideoById(videoId: string): void;
  playVideo(): void;
  stopVideo(): void;
}

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

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      await loadYouTubeApi();
      await new Promise<void>((resolve) => {
        this.player = new window.YT!.Player(this.containerId, {
          height: "0",
          width: "0",
          playerVars: { autoplay: 0, controls: 0 },
          events: { onReady: () => resolve() },
        });
      });
    })();
    return this.initPromise;
  }

  private async searchVideoId(query: string): Promise<string | null> {
    if (!API_KEY) {
      throw new Error(
        "Kein YouTube API-Key konfiguriert. Bitte VITE_YOUTUBE_API_KEY in der .env-Datei setzen (siehe README).",
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
      throw new Error(`YouTube-Suche fehlgeschlagen (Status ${res.status}).`);
    }
    const data = await res.json();
    return data.items?.[0]?.id?.videoId ?? null;
  }

  async loadAndPlay(song: Song): Promise<void> {
    await this.init();
    const videoId = await this.searchVideoId(song.searchQuery);
    if (!videoId || !this.player) {
      throw new Error(`Kein YouTube-Video für "${song.searchQuery}" gefunden.`);
    }
    this.player.loadVideoById(videoId);
    this.player.playVideo();
  }

  stop(): void {
    this.player?.stopVideo();
  }
}
