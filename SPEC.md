# Jazz Timeline — Spezifikation

Ein Browser-basiertes Musik-Ratespiel nach dem Vorbild des Brettspiels **Hitster**, thematisch auf Jazz fokussiert. Gespielt wird an einem gemeinsamen Gerät (Pass-and-Play), keine Accounts, kein Server nötig.

## 1. Ziel & Spielprinzip

Jeder Spieler baut über das Spiel hinweg seine **eigene, persönliche Timeline** aus Songkarten auf. In jeder Runde hört der aktive Spieler einen Song (Titel/Interpret zunächst verborgen) und muss ihn chronologisch korrekt in seine eigene Timeline einsortieren. Danach kann er optional zusätzliche Punkte durch genaues Rateb von Erscheinungsjahr, Interpret/Komponist (Nachname) und Genre sammeln. Das Spiel endet, wenn jeder Spieler 10 Karten gesammelt hat. Wer die meisten Punkte hat, gewinnt.

## 2. Spielablauf

### 2.1 Schritt 1 — Medienauswahl (Startbildschirm)
Beim Start wählt die Gruppe, mit welchem Musikdienst gespielt wird:
- **YouTube** (aktiv, v1)
- **Spotify** (Button sichtbar, aber als „bald verfügbar" markiert/deaktiviert)
- **Apple Music** (Button sichtbar, aber als „bald verfügbar" markiert/deaktiviert)

> **Warum nur YouTube in v1:** Spotify Web Playback erfordert einen Premium-Account und einen OAuth-Login-Flow, Apple Music erfordert ein kostenpflichtiges Apple Developer Programm (99 $/Jahr) plus MusicKit-Token. YouTube benötigt lediglich einen kostenlosen Data-API-Key und funktioniert ohne Abo. Die Architektur ist so gebaut (Adapter-Pattern, siehe 6.3), dass Spotify/Apple Music später ergänzt werden können, ohne den Rest der App anzufassen.

Die Auswahl wird im Spielzustand gespeichert (`mediaService: "youtube" | "spotify" | "apple"`).

### 2.2 Schritt 2 — Spieler-Setup
- Auswahl der Spieleranzahl (1–8 Spieler, auch Solo-Spiel möglich)
- Eingabe der Spielernamen
- Weiter zum Spielstart

### 2.3 Schritt 3 — Spielrunde (pro Zug)
1. Anzeige: „Spieler X ist dran"
2. Button „Song abspielen" → zufälliger, noch nicht verwendeter Song wird über den gewählten Dienst geladen und abgespielt. Titel/Interpret/Jahr/Genre bleiben verborgen.
3. Spieler platziert die neue Karte in seiner **eigenen** Timeline: Auswahl der Position relativ zu bereits platzierten Karten (z. B. „vor 1962er Karte" / „zwischen 1955 und 1962" / „nach neuester Karte"). Bei der ersten Karte gibt es keine Vorgabe.
4. Optionale Zusatz-Eingaben vor der Auflösung:
   - Exaktes Erscheinungsjahr (Zahlenfeld)
   - Nachname des Interpreten/Komponisten (Textfeld)
   - Genre (Auswahl aus fester Liste, siehe 3.3) — **optionales Feature**, per Einstellung ab-/anschaltbar
5. Auflösung: Song-Infos (Titel, Interpret, Jahr, Genre) werden aufgedeckt, Punkte werden nach den Regeln in Abschnitt 3 berechnet und der Karte in der Timeline dauerhaft hinzugefügt (unabhängig davon, ob die Platzierung richtig war — es gibt in dieser Variante kein Verwerfen von Karten, siehe 3.1).
6. „Nächster Spieler" → Zug geht reihum weiter.

Das Spiel endet, sobald jeder Spieler 10 Karten in seiner Timeline hat.

### 2.4 Schritt 4 — Endstand
Anzeige aller Spieler mit Gesamtpunktzahl, sortiert absteigend, Gewinner hervorgehoben.

## 3. Punkteregeln

Pro Karte/Zug sind folgende Punkte erzielbar:

| Aktion | Punkte |
|---|---|
| Karte chronologisch korrekt in die eigene Timeline einsortiert | **1** |
| Exaktes Erscheinungsjahr korrekt erraten | **+1** |
| Nachname Interpret/Komponist korrekt erraten (case-insensitive, einfacher String-Vergleich) | **+1** |
| Genre korrekt erraten (nur wenn Feature aktiviert) | **+1** |

Maximal 3 Punkte pro Karte (4, wenn Genre-Feature aktiviert ist).

### 3.1 Chronologische Korrektheit
Eine Platzierung ist korrekt, wenn das Erscheinungsjahr des neuen Songs zwischen den Jahren der direkten Nachbarkarten an der gewählten Position liegt (bzw. vor der ersten/nach der letzten Karte, wenn an den Rand platziert). Die Karte wird **immer** der Timeline hinzugefügt (an der vom Spieler gewählten Position wird sie einsortiert; bei falscher Platzierung wird sie nach der Auflösung automatisch an die chronologisch richtige Stelle "korrigiert", damit die Timeline für Folgeentscheidungen weiterhin konsistent nutzbar bleibt) — es werden nur Punkte vergeben oder nicht.

### 3.2 Interpret/Komponist-Nachname
Freitext-Eingabe, Vergleich gegen `artistLastName` aus dem Song-Datensatz (Kleinschreibung, getrimmt). Bei mehreren Interpreten reicht der Nachname eines beteiligten Interpreten.

### 3.3 Genre-Liste (optionales Feature)
Falls aktiviert, wählt der Spieler eines der folgenden Genres:

`Ragtime, New Orleans, Chicago, Swing, Bebop, Cool Jazz, Vocal Jazz, Hard Bop, Modal Jazz, Free Jazz, Fusion, Modern Jazz`

Jeder Song im Datensatz hat genau ein zugeordnetes Genre aus dieser Liste.

## 4. Datenmodell

### 4.1 Song
```ts
interface Song {
  id: string;
  title: string;
  artist: string;          // vollständiger Anzeigename, z.B. "Louis Armstrong"
  artistLastName: string;  // Vergleichswert für die Ratefunktion, z.B. "armstrong"
  year: number;             // Erscheinungsjahr der Aufnahme/Veröffentlichung
  genre: Genre;              // eines der 12 Genres aus 3.3
  searchQuery: string;      // Query für die YouTube-Suche, z.B. "Louis Armstrong What a Wonderful World"
}
```

Ein kuratierter Datensatz mit ca. 60–80 bekannten Jazz-Aufnahmen liegt der App bei (`src/data/songs.json`), verteilt über alle Genres und Jahrzehnte (1920er bis 2010er), damit auch bei mehreren Spielern und 10 Runden genug Songs ohne Wiederholung zur Verfügung stehen (Minimum: Spieleranzahl × 10 unterschiedliche Songs).

### 4.2 Spielzustand
```ts
interface Player {
  id: string;
  name: string;
  timeline: PlacedCard[];   // chronologisch sortiert
  score: number;
}

interface PlacedCard {
  song: Song;
  correctPlacement: boolean;
  correctYear: boolean;
  correctArtist: boolean;
  correctGenre: boolean | null; // null wenn Feature deaktiviert
}

interface GameState {
  mediaService: "youtube" | "spotify" | "apple";
  genreFeatureEnabled: boolean;
  players: Player[];
  currentPlayerIndex: number;
  usedSongIds: string[];
  roundsPerPlayer: number; // fix 10
  phase: "setup-media" | "setup-players" | "playing" | "finished";
}
```

## 5. Tech-Stack

- **React + TypeScript + Vite** — Single-Page-App, kein Backend nötig
- **State:** React State/Context, Persistenz optional via `localStorage` (Spiel kann bei Reload fortgesetzt werden)
- **Styling:** einfaches, eigenständiges CSS (keine externen UI-Kits nötig)
- **YouTube-Integration:**
  - YouTube Data API v3 (`search.list`) zum Finden eines passenden Videos anhand `searchQuery`
  - YouTube IFrame Player API zur Wiedergabe
  - Erfordert einen kostenlosen Google-API-Key (`VITE_YOUTUBE_API_KEY` in `.env`), vom Nutzer selbst über die Google Cloud Console zu erstellen (YouTube Data API v3 aktivieren)
- **Deployment:** statisches Hosting (z. B. Vercel, Netlify, GitHub Pages) — kein Server nötig, da alles clientseitig läuft

## 6. Architektur-Hinweise

### 6.1 Ordnerstruktur (Vorschlag)
```
src/
  data/songs.json
  types/game.ts
  state/gameReducer.ts
  services/musicService.ts      # Adapter-Interface
  services/youtubeService.ts    # YouTube-Implementierung
  components/MediaSelectScreen.tsx
  components/PlayerSetupScreen.tsx
  components/GameScreen.tsx
  components/Timeline.tsx
  components/GuessForm.tsx
  components/ResultScreen.tsx
  App.tsx
```

### 6.2 Song-Auswahl pro Zug
Zufällige Auswahl eines Songs aus `songs.json`, dessen `id` noch nicht in `usedSongIds` enthalten ist.

### 6.3 Adapter-Pattern für Musikdienste
`musicService.ts` definiert ein Interface (`loadAndPlay(song): Promise<void>`, `stop(): void`), das `youtubeService.ts` implementiert. Spotify/Apple Music können später als weitere Implementierungen dieses Interfaces ergänzt werden, ohne Game-Logik oder UI anzufassen.

## 7. Nicht in v1 enthalten (bewusst zurückgestellt)
- Spotify- und Apple-Music-Wiedergabe (Buttons vorhanden, aber deaktiviert)
- Mehrgeräte-/Online-Multiplayer (nur Pass-and-Play an einem Gerät)
- Kartenverlust bei falscher Platzierung (Hitster-Original-Regel) — hier: immer nur Punkte, keine verlorenen Karten
- Nutzerkonten, Highscore-Speicherung serverseitig
