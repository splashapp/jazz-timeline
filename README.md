# Jazz Timeline

Ein browserbasiertes Musik-Ratespiel nach dem Vorbild von **Hitster**, fokussiert auf Jazz. Details zum Spielprinzip und den Regeln stehen in [SPEC.md](./SPEC.md).

## Setup

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
2. YouTube Data API v3 Key erstellen (kostenlos):
   - [Google Cloud Console](https://console.cloud.google.com/) → neues Projekt anlegen
   - "APIs & Services" → "Bibliothek" → **YouTube Data API v3** aktivieren
   - "Anmeldedaten" → "API-Schlüssel erstellen"
3. `.env.example` nach `.env` kopieren und den Key eintragen:
   ```bash
   cp .env.example .env
   ```
   ```
   VITE_YOUTUBE_API_KEY=dein-api-key
   ```
4. Dev-Server starten:
   ```bash
   npm run dev
   ```

## Spielen

Ein Gerät wird zwischen den Spielern herumgereicht (Pass-and-Play). Ablauf:

1. Musikdienst wählen (aktuell nur YouTube verfügbar)
2. Spieleranzahl und Namen eingeben
3. Reihum: Song abspielen, in die eigene Timeline einordnen, optional Jahr/Interpret/Genre erraten
4. Nach 10 Karten pro Spieler gewinnt, wer die meisten Punkte hat

## Build

```bash
npm run build
```
