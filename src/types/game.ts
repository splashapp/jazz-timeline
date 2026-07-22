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
  // Short, curated one-sentence fact shown after the reveal. Left undefined
  // for songs where no reliably-verified fact was found — never guessed.
  context?: string;
}

export type JokerType = "year" | "artist";

export interface PlacedCard {
  song: Song;
  correctPlacement: boolean;
  correctYear: boolean;
  yearGuess: number | null;
  jokerUsed: JokerType | null;
  artistGuess: string | null;
  correctArtist: boolean | null;
}

export interface Player {
  id: string;
  name: string;
  timeline: PlacedCard[];
  score: number;
  jokersRemaining: number;
}

export type GamePhase = "setup-media" | "playing" | "finished";

// A turn now moves through distinct, separately-committed steps rather than
// one combined gesture. Grabbing and dragging the card across the timeline
// to choose a gap happens entirely as local UI/pointer state (no reducer
// phase needed for that continuous gesture) while still "listening"; only
// once it's released does the turn move to a full-width year corridor
// slider for the exact year ("guessing-year"), then an optional joker
// risk/reward step (only reachable when the corridor was wide enough to
// make guessing meaningful and the player still has jokers left), before
// the actual reveal.
export type TurnPhase = "ready" | "listening" | "guessing-year" | "joker" | "revealed";

export interface GameState {
  phase: GamePhase;
  mediaService: MediaService | null;
  players: Player[];
  currentPlayerIndex: number;
  usedSongIds: string[];
  roundsPerPlayer: number;
  turnPhase: TurnPhase;
  currentSong: Song | null;
  // The gap index locked in during "placing", carried through
  // "guessing-year"/"joker" until the turn is finalized.
  pendingPlacementIndex: number | null;
  // The year committed during "guessing-year", carried through "joker"
  // until the turn is finalized.
  pendingYearGuess: number | null;
}
