# Jazz Timeline

A browser-based music guessing game inspired by **Hitster**, focused on jazz. Details on gameplay and rules are in [SPEC.md](./SPEC.md).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a YouTube Data API v3 key (free):
   - [Google Cloud Console](https://console.cloud.google.com/) → create a new project
   - "APIs & Services" → "Library" → enable **YouTube Data API v3**
   - "Credentials" → "Create API Key"
3. Copy `.env.example` to `.env` and add your key:
   ```bash
   cp .env.example .env
   ```
   ```
   VITE_YOUTUBE_API_KEY=your-api-key
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Playing

One device is passed around between players (pass-and-play). Flow:

1. Splash screen with the poster, then straight into player setup
2. Enter number of players and names
3. Take turns: play a song, place it in your own timeline, optionally guess year/artist/genre
4. After 10 cards per player, whoever has the most points wins

## Build

```bash
npm run build
```
