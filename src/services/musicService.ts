import type { Song } from "../types/game";

export interface MusicService {
  init(): Promise<void>;
  resolveVideoId(query: string): Promise<string | null>;
  cueVideoId(videoId: string): void;
  playVideoId(videoId: string): void;
  loadAndPlay(song: Song): Promise<string>;
  play(): void;
  pause(): void;
  stop(): void;
  destroy(): void;
  onPlayStateChange(cb: (isPlaying: boolean) => void): void;
  onPlaybackError(cb: () => void): void;
}
