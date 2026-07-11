import type { MusicService } from "./musicService";
import type { Song } from "../types/game";

// Dev-only stand-in for YouTubeMusicService: no network calls, no real
// audio, no API quota used. Lets the "Mock YouTube" toggle on the splash
// screen exercise the full game flow (search, play, pause, replay) while
// testing UI/design changes locally.
export class MockMusicService implements MusicService {
  private blockedCb: ((blocked: boolean) => void) | null = null;
  private playStateCb: ((isPlaying: boolean) => void) | null = null;

  async init(): Promise<void> {
    // Nothing to set up.
  }

  onPlaybackBlocked(cb: (blocked: boolean) => void): void {
    this.blockedCb = cb;
  }

  onPlayStateChange(cb: (isPlaying: boolean) => void): void {
    this.playStateCb = cb;
  }

  onPlaybackError(_cb: () => void): void {
    // The mock never fails, so there's nothing to report.
  }

  async resolveVideoId(query: string): Promise<string | null> {
    // Small artificial delay so async UI states (loading spinners etc.)
    // still get exercised, without hitting a real API.
    await new Promise((r) => setTimeout(r, 150));
    return `mock-${query.length}`;
  }

  playVideoId(_videoId: string): void {
    this.playStateCb?.(true);
    this.blockedCb?.(false);
  }

  async loadAndPlay(song: Song): Promise<string> {
    const videoId = (await this.resolveVideoId(song.searchQuery)) ?? "mock-unknown";
    this.playVideoId(videoId);
    return videoId;
  }

  play(): void {
    this.playStateCb?.(true);
  }

  pause(): void {
    this.playStateCb?.(false);
  }

  stop(): void {
    this.playStateCb?.(false);
    this.blockedCb?.(false);
  }
}
