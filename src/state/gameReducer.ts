import type { GameState, Player, Song, PlacedCard, Genre, MediaService } from "../types/game";
import songsData from "../data/songs.json";

const ALL_SONGS = songsData as Song[];

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
  };
}

export type GameAction =
  | { type: "SET_GENRE_FEATURE"; enabled: boolean }
  | { type: "START_GAME"; mediaService: MediaService; playerNames: string[] }
  | { type: "DRAW_SONG"; song: Song | null }
  | { type: "PLACE_CARD"; index: number }
  | { type: "REVEAL"; yearGuess: number | null; artistGuess: string; genreGuess: Genre | null }
  | { type: "NEXT_TURN"; song: Song | null }
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
      return {
        ...state,
        mediaService: action.mediaService,
        players,
        currentPlayerIndex: 0,
        usedSongIds: [],
        phase: "playing",
        turnPhase: "ready",
        currentSong: null,
        pendingPlacementIndex: null,
      };
    }

    case "DRAW_SONG": {
      const song = action.song;
      if (!song) {
        return { ...state, phase: "finished" };
      }
      return {
        ...state,
        currentSong: song,
        usedSongIds: [...state.usedSongIds, song.id],
        turnPhase: "listening",
      };
    }

    case "PLACE_CARD":
      return { ...state, pendingPlacementIndex: action.index, turnPhase: "guessing" };

    case "REVEAL": {
      if (!state.currentSong || state.pendingPlacementIndex === null) return state;
      const song = state.currentSong;
      const players = [...state.players];
      const player = { ...players[state.currentPlayerIndex] };
      const timeline = [...player.timeline];
      const index = state.pendingPlacementIndex;

      const correctPlacement = isPlacementCorrect(timeline, index, song.year);
      const correctYear = action.yearGuess !== null && action.yearGuess === song.year;
      const correctArtist = matchesLastName(action.artistGuess, song.artistLastName);
      const correctGenre = state.genreFeatureEnabled ? action.genreGuess === song.genre : null;

      const placed: PlacedCard = {
        song,
        correctPlacement,
        correctYear,
        correctArtist,
        correctGenre,
        yearGuess: action.yearGuess,
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

      return { ...state, players, turnPhase: "revealed" };
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
      // The next song is picked by the caller (GameScreen) and passed in
      // here so the very same click that advances the turn can also start
      // playback synchronously — going straight to "listening" instead of
      // a separate "ready" gate that would need its own button/gesture.
      const song = action.song;
      return {
        ...state,
        currentPlayerIndex: nextIndex,
        turnPhase: song ? "listening" : "ready",
        currentSong: song,
        usedSongIds: song ? [...state.usedSongIds, song.id] : state.usedSongIds,
        pendingPlacementIndex: null,
      };
    }

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}
