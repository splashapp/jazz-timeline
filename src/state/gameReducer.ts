import type { GameState, Player, Song, PlacedCard, MediaService, JokerType } from "../types/game";
import songsData from "../data/songs.json";
import { boundsFor, SONG_YEAR_RANGE } from "../utils/placement";

const ALL_SONGS = songsData as Song[];

export { SONG_YEAR_RANGE };

// A corridor this wide (or wider) makes an exact-year guess meaningful
// enough to risk a joker on; below this, guessing is close to a coin flip
// anyway and the joker step is skipped entirely. Exported so the UI can
// decide identically whether to gray out the joker's Year option.
export const JOKER_MIN_CORRIDOR = 4;
const JOKER_STARTING_COUNT = 2;

export function createInitialState(): GameState {
  return {
    phase: "setup-media",
    mediaService: null,
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
  | { type: "START_GAME"; mediaService: MediaService; playerNames: string[] }
  | { type: "LOCK_PLACEMENT"; index: number }
  | { type: "GUESS_YEAR"; yearGuess: number }
  | { type: "USE_JOKER"; jokerType: JokerType; artistGuess?: string }
  | { type: "SKIP_JOKER" }
  | { type: "NEXT_TURN" }
  | { type: "RESET" };

export function pickRandomSong(usedIds: string[]): Song | null {
  const available = ALL_SONGS.filter((s) => !usedIds.includes(s.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function isPlacementCorrect(timeline: PlacedCard[], index: number, year: number): boolean {
  const before = timeline[index - 1];
  const after = timeline[index];
  if (before && year < before.song.year) return false;
  if (after && year > after.song.year) return false;
  return true;
}

interface JokerOutcome {
  jokerUsed: JokerType | null;
  artistGuess: string | null;
  correctArtist: boolean | null;
  yearBonus: number; // added on top of the base +1/0 for an exact year guess
  jokerPenalty: number; // subtracted once if the joker guess was wrong
}

const NO_JOKER: JokerOutcome = {
  jokerUsed: null,
  artistGuess: null,
  correctArtist: null,
  yearBonus: 0,
  jokerPenalty: 0,
};

// Bundles the placement + scoring logic shared by every path that ends a
// turn (no-joker, joker used, joker skipped) — insert-and-sort the card,
// compute placement/year correctness, apply the joker's outcome, award
// points, and move to "revealed".
function finalizeTurn(state: GameState, joker: JokerOutcome): GameState {
  if (!state.currentSong || state.pendingPlacementIndex === null || state.pendingYearGuess === null) {
    return state;
  }
  const song = state.currentSong;
  const index = state.pendingPlacementIndex;
  const yearGuess = state.pendingYearGuess;

  const players = [...state.players];
  const player = { ...players[state.currentPlayerIndex] };
  const timeline = [...player.timeline];

  const correctPlacement = isPlacementCorrect(timeline, index, song.year);
  const correctYear = yearGuess === song.year;

  const placed: PlacedCard = {
    song,
    correctPlacement,
    correctYear,
    yearGuess,
    jokerUsed: joker.jokerUsed,
    artistGuess: joker.artistGuess,
    correctArtist: joker.correctArtist,
  };

  timeline.splice(index, 0, placed);
  timeline.sort((a, b) => a.song.year - b.song.year);

  let points = 0;
  if (correctPlacement) points += 1;
  if (correctYear) points += 1 + joker.yearBonus;
  points -= joker.jokerPenalty;

  player.timeline = timeline;
  player.score += points;
  if (joker.jokerUsed) player.jokersRemaining -= 1;
  players[state.currentPlayerIndex] = player;

  return {
    ...state,
    players,
    turnPhase: "revealed",
    pendingPlacementIndex: null,
    pendingYearGuess: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const players: Player[] = action.playerNames.map((name, i) => ({
        id: `p${i}`,
        name,
        timeline: [],
        score: 0,
        jokersRemaining: JOKER_STARTING_COUNT,
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
      };
    }

    // The card has been dragged across the timeline and released over a
    // gap — that gap is now locked in, and the turn moves on to the
    // separate year-corridor step.
    case "LOCK_PLACEMENT": {
      if (!state.currentSong) return state;
      return { ...state, turnPhase: "guessing-year", pendingPlacementIndex: action.index };
    }

    // The year corridor slider was released. If the corridor was wide
    // enough to make a guess meaningful and the player still has jokers,
    // offer the joker step; otherwise the turn is already fully decided.
    case "GUESS_YEAR": {
      if (!state.currentSong || state.pendingPlacementIndex === null) return state;
      const player = state.players[state.currentPlayerIndex];
      const corridor = boundsFor(player.timeline, state.pendingPlacementIndex);
      const corridorWidth = corridor.max - corridor.min;
      const stateWithGuess = { ...state, pendingYearGuess: action.yearGuess };
      if (corridorWidth > JOKER_MIN_CORRIDOR && player.jokersRemaining > 0) {
        return { ...stateWithGuess, turnPhase: "joker" };
      }
      return finalizeTurn(stateWithGuess, NO_JOKER);
    }

    case "USE_JOKER": {
      if (!state.currentSong) return state;
      const song = state.currentSong;
      if (action.jokerType === "year") {
        const correctYear = state.pendingYearGuess === song.year;
        return finalizeTurn(state, {
          jokerUsed: "year",
          artistGuess: null,
          correctArtist: null,
          yearBonus: correctYear ? 1 : 0, // +1 on top of the base +1 = +2 total
          jokerPenalty: correctYear ? 0 : 2,
        });
      }
      const artistGuess = action.artistGuess ?? null;
      const correctArtist = artistGuess === song.artist;
      return finalizeTurn(state, {
        jokerUsed: "artist",
        artistGuess,
        correctArtist,
        yearBonus: 0,
        jokerPenalty: correctArtist ? 0 : 2,
      });
    }

    case "SKIP_JOKER":
      return finalizeTurn(state, NO_JOKER);

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
