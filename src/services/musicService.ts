import type { Song } from "../types/game";

export interface MusicService {
  init(): Promise<void>;
  resolveVideoId(query: string): Promise<string | null>;
  playVideoId(videoId: string): void;
  loadAndPlay(song: Song): Promise<string>;
  play(): void;
  stop(): void;
  onPlaybackBlocked(cb: (blocked: boolean) => void): void;
}
