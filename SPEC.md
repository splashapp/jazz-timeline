# Jazz Timeline — Specification

A browser-based music guessing game inspired by the board game **Hitster**, themed around jazz. Played on a single shared device (pass-and-play), no accounts, no server required.

## 1. Goal & Game Concept

Over the course of the game, each player builds their own **personal timeline** of song cards. On each turn, the active player listens to a song (title/artist hidden at first) and must place it chronologically correctly into their own timeline. They can then optionally earn bonus points by guessing the exact release year, the artist's/composer's last name, and the genre. The game ends once every player has collected 10 cards. Whoever has the most points wins.

## 2. Game Flow

### 2.1 Step 1 — Splash Screen
On launch, the app shows a full-screen poster (title "Jazz Timeline" above the artwork, "by Alex Rueß" below it). It automatically advances to player setup after 5 seconds, or immediately on tap/click anywhere on the screen.

There is no music-service selection — the game always uses **YouTube** for playback (`mediaService` is fixed to `"youtube"` internally).

> **Why only YouTube:** Spotify Web Playback requires a Premium account and an OAuth login flow; Apple Music requires a paid Apple Developer Program membership ($99/year) plus a MusicKit token. YouTube only needs a free Data API key and works without a subscription. The architecture uses an adapter pattern (see 6.3) so Spotify/Apple Music could be added later without touching the rest of the app.

### 2.2 Step 2 — Player Setup
- Choose the number of players (1–8; solo play is possible) via tappable count chips — no typing required
- Enter player names
- Continue to start the game

### 2.3 Step 3 — Turn Loop (per turn)
1. Display: "It's Player X's turn"
2. "Play Song" button → a random, not-yet-used song is loaded and played via YouTube. Title/artist/year/genre stay hidden.
3. The player places the new card into their **own** timeline: choosing a position relative to already-placed cards (e.g. "before the 1962 card" / "between 1955 and 1962" / "after the newest card"). The first card has no prior constraint.
4. Optional bonus guesses before reveal:
   - Exact release year (number field)
   - Artist's/composer's last name (text field)
   - Genre (choice from a fixed list, see 3.3) — **optional feature**, can be toggled on/off in settings
5. Reveal: song info (title, artist, year, genre) is uncovered, points are calculated per the rules in section 3, and the card is permanently added to the timeline (regardless of whether the placement was correct — in this variant cards are never discarded, see 3.1). After a reveal, any already-placed card in the timeline can be tapped to replay its song while the "Next" button stays available.
6. "Next Player" → turn passes to the next player.

The game ends once every player has 10 cards in their timeline.

### 2.4 Step 4 — Final Results
Shows all players with their total score, sorted descending, winner highlighted.

## 3. Scoring Rules

The following points can be earned per card/turn:

| Action | Points |
|---|---|
| Card placed chronologically correctly in the player's own timeline | **1** |
| Exact release year guessed correctly | **+1** |
| Artist's/composer's last name guessed correctly (case-insensitive, simple string comparison) | **+1** |
| Genre guessed correctly (only if the feature is enabled) | **+1** |

Maximum of 3 points per card (4 if the genre feature is enabled).

### 3.1 Chronological Correctness
A placement is correct if the new song's release year falls between the years of the cards directly neighboring the chosen position (or before the first / after the last card, if placed at an edge). The card is **always** added to the timeline (it's inserted at the position the player chose; if the placement was wrong, it's automatically "corrected" to its chronologically right spot after the reveal, so the timeline stays consistent for future decisions) — only whether points are awarded depends on correctness.

### 3.2 Artist/Composer Last Name
Free-text input, compared against `artistLastName` from the song record (lowercased, trimmed). For songs with multiple artists, the last name of any one of them is accepted.

### 3.3 Genre List (optional feature)
If enabled, the player picks one of the following genres:

`Ragtime, New Orleans, Chicago, Swing, Bebop, Cool Jazz, Vocal Jazz, Hard Bop, Modal Jazz, Free Jazz, Fusion, Modern Jazz`

Every song in the dataset has exactly one genre assigned from this list.

## 4. Data Model

### 4.1 Song
```ts
interface Song {
  id: string;
  title: string;
  artist: string;          // full display name, e.g. "Louis Armstrong"
  artistLastName: string;  // comparison value for the guessing feature, e.g. "armstrong"
  year: number;             // release year of the recording/release
  genre: Genre;              // one of the 12 genres from 3.3
  searchQuery: string;      // query used for the YouTube search, e.g. "Louis Armstrong What a Wonderful World"
}
```

A curated dataset of roughly 60–80 well-known jazz recordings ships with the app (`src/data/songs.json`), spread across all genres and decades (1920s to 2010s), so that even with multiple players and 10 rounds there are enough songs without repeats (minimum: number of players × 10 distinct songs).

### 4.2 Game State
```ts
interface Player {
  id: string;
  name: string;
  timeline: PlacedCard[];   // sorted chronologically
  score: number;
}

interface PlacedCard {
  song: Song;
  correctPlacement: boolean;
  correctYear: boolean;
  correctArtist: boolean;
  correctGenre: boolean | null; // null if the feature is disabled
}

interface GameState {
  mediaService: "youtube" | "spotify" | "apple";
  genreFeatureEnabled: boolean;
  players: Player[];
  currentPlayerIndex: number;
  usedSongIds: string[];
  roundsPerPlayer: number; // fixed at 10
  phase: "setup-media" | "setup-players" | "playing" | "finished";
}
```

## 5. Tech Stack

- **React + TypeScript + Vite** — single-page app, no backend required
- **State:** React state/context, persistence optional via `localStorage` (game can resume after a reload)
- **Styling:** plain, self-contained CSS (no external UI kits needed)
- **YouTube integration:**
  - YouTube Data API v3 (`search.list`) to find a matching video from `searchQuery`
  - YouTube IFrame Player API for playback
  - Requires a free Google API key (`VITE_YOUTUBE_API_KEY` in `.env`), created by the user via the Google Cloud Console (enable YouTube Data API v3)
- **Deployment:** static hosting (e.g. Vercel, Netlify, GitHub Pages) — no server needed since everything runs client-side

## 6. Architecture Notes

### 6.1 Folder Structure (proposed)
```
src/
  data/songs.json
  types/game.ts
  state/gameReducer.ts
  services/musicService.ts      # adapter interface
  services/youtubeService.ts    # YouTube implementation
  components/SplashScreen.tsx
  components/PlayerSetupScreen.tsx
  components/GameScreen.tsx
  components/TurnCard.tsx
  components/Timeline.tsx
  components/GuessForm.tsx
  components/ResultScreen.tsx
  App.tsx
```

### 6.2 Song Selection per Turn
Random selection of a song from `songs.json` whose `id` is not yet in `usedSongIds`.

### 6.3 Adapter Pattern for Music Services
`musicService.ts` defines an interface (`loadAndPlay(song): Promise<string>`, `stop(): void`, etc.) that `youtubeService.ts` implements. Spotify/Apple Music could later be added as further implementations of this interface without touching game logic or UI.

## 7. Not Included in v1 (deliberately deferred)
- Spotify and Apple Music playback (adapter interface supports it, but no implementation ships)
- Multi-device/online multiplayer (pass-and-play on one device only)
- Losing a card on incorrect placement (the original Hitster rule) — here: points only, no cards are ever lost
- User accounts, server-side high-score storage
