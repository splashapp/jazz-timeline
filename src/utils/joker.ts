import type { Song } from "../types/game";
import songsData from "../data/songs.json";

const ALL_SONGS = songsData as Song[];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 4 random distinct distractor artists from the rest of the dataset plus
// the correct one, shuffled — the joker's "Artist" multiple-choice.
export function pickArtistOptions(correctArtist: string): string[] {
  const others = Array.from(new Set(ALL_SONGS.map((s) => s.artist).filter((a) => a !== correctArtist)));
  const distractors = shuffle(others).slice(0, 4);
  return shuffle([correctArtist, ...distractors]);
}
