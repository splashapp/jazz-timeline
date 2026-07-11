import type { Song } from "../types/game";

const STORAGE_KEY = "jazz-timeline:video-id-issues";
const MAX_ENTRIES = 100;

export interface VideoIdIssue {
  songId: string;
  title: string;
  artist: string;
  reason: "missing" | "stale";
  timestamp: string;
}

// Client-only admin log: no backend, so this only surfaces issues on the
// device that hit them. Check via the browser console (grep "[JazzTimeline]")
// or open the app with ?debug=1 for a readable list.
export function logVideoIdIssue(song: Song, reason: VideoIdIssue["reason"]): void {
  const entry: VideoIdIssue = {
    songId: song.id,
    title: song.title,
    artist: song.artist,
    reason,
    timestamp: new Date().toISOString(),
  };
  const label = reason === "stale" ? "stale videoId, re-searched" : "no stored videoId, searched live";
  console.warn(`[JazzTimeline] ${label}: "${song.title}" – ${song.artist} (${song.id})`);

  try {
    const next = [entry, ...getVideoIdIssues()].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage can be unavailable (private mode, full quota); the
    // console.warn above already recorded the issue for this session.
  }
}

export function getVideoIdIssues(): VideoIdIssue[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VideoIdIssue[]) : [];
  } catch {
    return [];
  }
}

export function clearVideoIdIssues(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
