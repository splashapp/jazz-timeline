# Jazz Timeline

A browser-based music guessing game inspired by **Hitster**, focused on jazz. Details on gameplay and rules are in [SPEC.md](./SPEC.md).

## Getting a YouTube API Key

Both local development and deployment need a YouTube Data API v3 key. It's free.

1. **Sign in to Google Cloud** — go to the [Google Cloud Console](https://console.cloud.google.com) and sign in with your Google account.
2. **Create a project** (or use an existing one) — open the project dropdown at the top, click **New Project**, give it a name (e.g. `my-youtube-app`), and create it.
3. **Enable the YouTube Data API v3** — in the left navigation, go to **APIs & Services** → **Library**, search for "YouTube Data API v3", select it, and click **Enable**.
4. **Create the API key** — go back to **APIs & Services** → **Credentials**, click **Create credentials** → **API key**. Your key is shown immediately — copy it.
5. **Restrict the key (optional but recommended)** — click **Restrict key** on the new credential to limit it to specific websites and/or the YouTube Data API specifically, so the key can't be reused elsewhere if it ever leaks.

Where this key goes next depends on whether you're running the app locally ([Setup](#setup)) or deploying it ([Deployment](#deployment-vercel)).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Get a YouTube Data API v3 key if you don't already have one — see [Getting a YouTube API Key](#getting-a-youtube-api-key) above.
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

1. Start screen with the poster — tap "▶ Play Solo" to jump straight in, or "With Multiple Players →" to enter names first
2. Take turns: play a song, place it in your own timeline, optionally guess year/artist/genre
3. After 10 cards per player, whoever has the most points wins

## Build

```bash
npm run build
```

## Deployment (Vercel)

This is a static, client-only app, so it deploys to Vercel with no server config — just connect the repo. The one thing you must set up yourself is the YouTube API key.

### Setting `VITE_YOUTUBE_API_KEY`

1. Open your project on [vercel.com](https://vercel.com) and go to **Settings**.
2. Open the **Environment Variables** section.
3. Click **Add Environment Variable**:
   - **Key:** `VITE_YOUTUBE_API_KEY`
   - **Value:** your YouTube Data API v3 key
   - **Environments:** select at least **Production**, and also **Preview**/**Development** if you need the key there too.
4. Save, then trigger a new deployment (**Redeploy**, or just push a commit).

Step 4 is not optional: Vite inlines `VITE_*` variables into the JS bundle **at build time**. Saving the variable in the dashboard does nothing to a build that already ran — only a build that starts *after* the variable is set will pick it up. If you still see "No YouTube API key configured" after saving the variable, you almost always just need to redeploy.

### Quota note

The free YouTube Data API tier only allows **100 search requests per day** per project. Because every song in `src/data/songs.json` ships with a pre-resolved `videoId` (see `scripts/resolve-video-ids.mjs`), normal play barely touches this quota — a live search only happens as a fallback for a song missing an id, or when a stored id has gone stale (video removed/private). If you add songs to `songs.json`, run the resolver script once afterwards so they get a `videoId` too, rather than relying on live search in production.

## Genre Icons & Colors

Each of the 12 genres has a fixed icon and accent color (`src/utils/genreColors.ts`), used consistently for the reveal screen's genre badge and the timeline card's accent border. Icons live in `src/assets/icons/` (sourced from `icons_final/`, see below).

| # | Genre | File | Motif | Era | Accent | Association |
|---|---|---|---|---|---|---|
| 1 | Ragtime | `ragtime.png` | Piano keys | 1890s–1910s | `#c9a24a` | Piano, printed sheet music |
| 2 | New Orleans | `new_orleans.png` | Trumpet | 1910s–20s | `#c1543a` | Brass band, street parade |
| 3 | Chicago | `chicago.png` | Whiskey glass | 1920s | `#d4941f` | Speakeasy, smoke |
| 4 | Swing | `swing.png` | Sunburst | 1930s–40s | `#e8c766` | Big band, dance hall |
| 5 | Bebop | `bebop.png` | Lightning bolt | 1940s–50s | `#8c2f2f` | Blue Note contrast, nightclub |
| 6 | Cool Jazz | `cool_jazz.png` | S-curve | 1950s | `#4a8ca8` | West Coast, calmer, airier |
| 7 | Vocal Jazz | `vocal_jazz.png` | Microphone | 1950s–60s | `#d9a6a6` | Microphone, stage light |
| 8 | Hard Bop | `hard_bop.png` | Double chevron | 1950s–60s | `#c1560c` | Blue Note graphics, hard and direct |
| 9 | Modal Jazz | `modal_jazz.png` | Ring + dot | Late 50s–60s | `#6a4fa0` | Minimalist, *Kind of Blue* aesthetic |
| 10 | Free Jazz | `free_jazz.png` | Chaotic crossing lines | 1960s | `#e0e0e0` | Abstract, angular, restless |
| 11 | Fusion | `fusion.png` | Infinity gradient | 1970s | `#2fb8a8` → `#d13fa0` | Psychedelic, electric |
| 12 | Modern Jazz | `modern_jazz.png` | Triangle + line | 1980s–today | `#c7c7c7` | Clean, minimalist, contemporary |

Notes:
- Fusion is the one genre with a two-tone identity — its badge/accent use a gradient instead of a solid fill.
- Badge text color is computed per genre (not fixed) by comparing WCAG contrast ratios against dark ink vs. cream, so pale accents (Swing, Free Jazz, Modern Jazz, Vocal Jazz) still get legible dark text.
- On timeline mini-cards the icon is dropped — at ~24–32px the line art reads as noise — so genre there is signaled by the accent border/color alone.
- Icons were cut from a hand-illustrated 4×4 sprite sheet (`icons_final/` holds the full-size transparent PNGs plus 32px preview thumbnails); `free_jazz` in particular is intentionally busy and reads as a blur at 32px, which is expected.
