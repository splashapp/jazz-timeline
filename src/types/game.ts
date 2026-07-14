export type MediaService = "youtube" | "spotify" | "apple" | "mock";

export type Genre =
  | "Ragtime"
  | "New Orleans"
  | "Chicago"
  | "Swing"
  | "Bebop"
  | "Cool Jazz"
  | "Vocal Jazz"
  | "Hard Bop"
  | "Modal Jazz"
  | "Free Jazz"
  | "Fusion"
  | "Modern Jazz";

export const GENRES: Genre[] = [
  "Ragtime",
  "New Orleans",
  "Chicago",
  "Swing",
  "Bebop",
  "Cool Jazz",
  "Vocal Jazz",
  "Hard Bop",
  "Modal Jazz",
  "Free Jazz",
  "Fusion",
  "Modern Jazz",
];

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistLastName: string;
  year: number;
  genre: Genre;
  searchQuery: string;
  videoId?: string;
}

export interface PlacedCard {
  song: Song;
  correctPlacement: boolean;
  correctYear: boolean;
  yearGuess: number | null;
}

export interface Player {
  id: string;
  name: string;
  timeline: PlacedCard[];
  score: number;
}

export type GamePhase = "setup-media" | "playing" | "finished";

// The year slider's placement + release already tells you everything you
// need to score a turn (placement + exact year) — there's no separate
// "guessing" gate/dialog anymore, so a turn goes straight from "listening"
// to "revealed" the moment the slider is released.
export type TurnPhase = "ready" | "listening" | "revealed";

export interface GameState {
  phase: GamePhase;
  mediaService: MediaService | null;
  players: Player[];
  currentPlayerIndex: number;
  usedSongIds: string[];
  roundsPerPlayer: number;
  turnPhase: TurnPhase;
  currentSong: Song | null;
}
