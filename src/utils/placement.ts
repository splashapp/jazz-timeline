import type { PlacedCard, Song } from "../types/game";
import songsData from "../data/songs.json";

const ALL_SONGS = songsData as Song[];

// Fallback bounds for a placement slot with no neighbor on one side (the
// very start/end of the timeline) — grounded in the actual dataset's range
// rather than an arbitrary round number.
export const SONG_YEAR_RANGE = {
  min: Math.min(...ALL_SONGS.map((s) => s.year)),
  max: Math.max(...ALL_SONGS.map((s) => s.year)),
};

// The year corridor a card placed at `index` in `timeline` must fall
// within — shared between the placement drag (which gap is even choosable),
// the year corridor slider (its min/max), and the reducer (joker
// eligibility, which needs the same corridor width).
export function boundsFor(timeline: PlacedCard[], index: number): { min: number; max: number } {
  return {
    min: index > 0 ? timeline[index - 1].song.year : SONG_YEAR_RANGE.min,
    max: index < timeline.length ? timeline[index].song.year : SONG_YEAR_RANGE.max,
  };
}
