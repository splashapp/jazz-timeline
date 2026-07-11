import type { Song } from "../types/game";

export interface MusicService {
  init(): Promise<void>;
  loadAndPlay(song: Song): Promise<void>;
  play(): void;
  stop(): void;
  onPlaybackBlocked(cb: (blocked: boolean) => void): void;
}
