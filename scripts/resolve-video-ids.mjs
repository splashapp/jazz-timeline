#!/usr/bin/env node
// One-time (and re-runnable) script to resolve a fixed YouTube video id for
// every song in src/data/songs.json and store it there, so the app no
// longer needs a live search.list call (100/day quota) for known songs.
// Safe to re-run: songs that already have a videoId are skipped.
//
// Edits the file as text (one song per line) instead of via
// JSON.parse + JSON.stringify, so the hand-formatted layout (one song per
// line, blank lines between genre groups) is preserved untouched.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const songsPath = join(rootDir, "src", "data", "songs.json");

function loadEnvKey() {
  const envPath = join(rootDir, ".env");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^VITE_YOUTUBE_API_KEY=(.+)$/);
    if (match) return match[1].trim();
  }
  throw new Error("VITE_YOUTUBE_API_KEY not found in .env");
}

async function resolveVideoId(apiKey, query) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message ?? `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.items?.[0]?.id?.videoId ?? null;
}

function insertVideoIdInLine(line, videoId) {
  // Matches the closing "}" of the song object, with an optional trailing
  // comma (absent only for the last entry in the array).
  return line.replace(/\s*\}(\s*,?)\s*$/, (_m, trailingComma) => `, "videoId": "${videoId}" }${trailingComma}`);
}

async function main() {
  const apiKey = loadEnvKey();
  const songs = JSON.parse(readFileSync(songsPath, "utf-8"));
  let lines = readFileSync(songsPath, "utf-8").split("\n");

  const pending = songs.filter((s) => !s.videoId);
  console.log(`${songs.length} songs total, ${pending.length} missing a videoId.`);

  let resolved = 0;
  let failed = 0;

  for (const song of pending) {
    const lineIndex = lines.findIndex((l) => l.includes(`"id": "${song.id}"`));
    if (lineIndex === -1) {
      console.log(`✗ ${song.id}: line not found in file, skipping`);
      failed++;
      continue;
    }

    try {
      const videoId = await resolveVideoId(apiKey, song.searchQuery);
      if (videoId) {
        lines[lineIndex] = insertVideoIdInLine(lines[lineIndex], videoId);
        resolved++;
        console.log(`✓ ${song.title} — ${song.artist} -> ${videoId}`);
        // Persist after every song so a mid-run failure (e.g. quota hit)
        // doesn't lose progress already made.
        writeFileSync(songsPath, lines.join("\n"));
      } else {
        failed++;
        console.log(`✗ ${song.title} — ${song.artist}: no result`);
      }
    } catch (err) {
      if (err.status === 429) {
        console.error(
          `\nQuota exhausted after resolving ${resolved} song(s) this run. ` +
            `Re-run this script later (it will pick up where it left off).`,
        );
        process.exit(1);
      }
      failed++;
      console.log(`✗ ${song.title} — ${song.artist}: ${err.message}`);
    }
    // Be polite to the API between calls.
    await new Promise((r) => setTimeout(r, 150));
  }

  const stillMissing = pending.length - resolved;
  console.log(`\nDone. Resolved ${resolved}, failed ${failed}, remaining without videoId: ${stillMissing}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
