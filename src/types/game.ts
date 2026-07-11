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
  correctArtist: boolean;
  correctGenre: boolean | null;
  yearGuess: number | null;
  artistGuess: string;
  genreGuess: Genre | null;
}

export interface Player {
  id: string;
  name: string;
  timeline: PlacedCard[];
  score: number;
}

export type GamePhase = "setup-media" | "playing" | "finished";

export type TurnPhase = "ready" | "listening" | "guessing" | "revealed";

export interface GameState {
  phase: GamePhase;
  mediaService: MediaService | null;
  genreFeatureEnabled: boolean;
  players: Player[];
  currentPlayerIndex: number;
  usedSongIds: string[];
  roundsPerPlayer: number;
  turnPhase: TurnPhase;
  currentSong: Song | null;
  pendingPlacementIndex: number | null;
}
