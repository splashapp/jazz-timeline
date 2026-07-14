import type { GameState, Player, Song, PlacedCard, Genre, MediaService } from "../types/game";
import songsData from "../data/songs.json";

const ALL_SONGS = songsData as Song[];

// Fallback bounds for the timeline's year slider when a placement slot has
// no neighbor on one side (the very start/end of the timeline) — grounded
// in the actual dataset's range rather than an arbitrary round number.
export const SONG_YEAR_RANGE = {
  min: Math.min(...ALL_SONGS.map((s) => s.year)),
  max: Math.max(...ALL_SONGS.map((s) => s.year)),
};

export function createInitialState(): GameState {
  return {
    phase: "setup-media",
    mediaService: null,
    genreFeatureEnabled: true,
    players: [],
    currentPlayerIndex: 0,
    usedSongIds: [],
    roundsPerPlayer: 10,
    turnPhase: "ready",
    currentSong: null,
    pendingPlacementIndex: null,
    pendingYearGuess: null,
  };
}

export type GameAction =
  | { type: "SET_GENRE_FEATURE"; enabled: boolean }
  | { type: "START_GAME"; mediaService: MediaService; playerNames: string[] }
  | { type: "PLACE_CARD"; index: number; yearGuess: number }
  | { type: "REVEAL"; artistGuess: string; genreGuess: Genre | null }
  | { type: "NEXT_TURN" }
  | { type: "RESET" };

export function pickRandomSong(usedIds: string[]): Song | null {
  const available = ALL_SONGS.filter((s) => !usedIds.includes(s.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function isPlacementCorrect(timeline: PlacedCard[], index: number, year: number): boolean {
  const before = timeline[index - 1];
  const after = timeline[index];
  if (before && year < before.song.year) return false;
  if (after && year > after.song.year) return false;
  return true;
}

function matchesLastName(guess: string, artistLastName: string): boolean {
  const normalizedGuess = guess.trim().toLowerCase();
  if (!normalizedGuess) return false;
  const candidates = artistLastName.split("/").map((c) => c.trim());
  return candidates.includes(normalizedGuess);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_GENRE_FEATURE":
      return { ...state, genreFeatureEnabled: action.enabled };

    case "START_GAME": {
      const players: Player[] = action.playerNames.map((name, i) => ({
        id: `p${i}`,
        name,
        timeline: [],
        score: 0,
      }));
      // The reducer picks the song itself now (simple/original flow): the
      // player just starts the game, sees "Searching…" while useMusicPlayback
      // resolves the video, then an explicit Play button once it's ready —
      // no synchronous playback needs to happen inside this click itself.
      const song = pickRandomSong([]);
      if (!song) {
        return { ...state, phase: "finished" };
      }
      return {
        ...state,
        mediaService: action.mediaService,
        players,
        currentPlayerIndex: 0,
        usedSongIds: [song.id],
        phase: "playing",
        turnPhase: "listening",
        currentSong: song,
        pendingPlacementIndex: null,
        pendingYearGuess: null,
      };
    }

    case "PLACE_CARD":
      return {
        ...state,
        pendingPlacementIndex: action.index,
        pendingYearGuess: action.yearGuess,
        turnPhase: "guessing",
      };

    case "REVEAL": {
      if (!state.currentSong || state.pendingPlacementIndex === null) return state;
      const song = state.currentSong;
      const players = [...state.players];
      const player = { ...players[state.currentPlayerIndex] };
      const timeline = [...player.timeline];
      const index = state.pendingPlacementIndex;
      const yearGuess = state.pendingYearGuess;

      const correctPlacement = isPlacementCorrect(timeline, index, song.year);
      const correctYear = yearGuess !== null && yearGuess === song.year;
      const correctArtist = matchesLastName(action.artistGuess, song.artistLastName);
      const correctGenre = state.genreFeatureEnabled ? action.genreGuess === song.genre : null;

      const placed: PlacedCard = {
        song,
        correctPlacement,
        correctYear,
        correctArtist,
        correctGenre,
        yearGuess,
        artistGuess: action.artistGuess,
        genreGuess: action.genreGuess,
      };

      timeline.splice(index, 0, placed);
      timeline.sort((a, b) => a.song.year - b.song.year);

      let points = 0;
      if (correctPlacement) points += 1;
      if (correctYear) points += 1;
      if (correctArtist) points += 1;
      if (correctGenre) points += 1;

      player.timeline = timeline;
      player.score += points;
      players[state.currentPlayerIndex] = player;

      return { ...state, players, turnPhase: "revealed", pendingYearGuess: null };
    }

    case "NEXT_TURN": {
      const allDone = state.players.every((p) => p.timeline.length >= state.roundsPerPlayer);
      if (allDone) {
        return { ...state, phase: "finished" };
      }
      let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      let guard = 0;
      while (
        state.players[nextIndex].timeline.length >= state.roundsPerPlayer &&
        guard < state.players.length
      ) {
        nextIndex = (nextIndex + 1) % state.players.length;
        guard++;
      }
      const song = pickRandomSong(state.usedSongIds);
      if (!song) {
        return { ...state, phase: "finished" };
      }
      return {
        ...state,
        currentPlayerIndex: nextIndex,
        turnPhase: "listening",
        currentSong: song,
        usedSongIds: [...state.usedSongIds, song.id],
        pendingPlacementIndex: null,
        pendingYearGuess: null,
      };
    }

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}
