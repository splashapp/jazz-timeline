import type { CSSProperties } from "react";
import type { Genre } from "../types/game";

import ragtimeIcon from "../assets/icons/ragtime.png";
import newOrleansIcon from "../assets/icons/new_orleans.png";
import chicagoIcon from "../assets/icons/chicago.png";
import swingIcon from "../assets/icons/swing.png";
import bebopIcon from "../assets/icons/bebop.png";
import coolJazzIcon from "../assets/icons/cool_jazz.png";
import vocalJazzIcon from "../assets/icons/vocal_jazz.png";
import hardBopIcon from "../assets/icons/hard_bop.png";
import modalJazzIcon from "../assets/icons/modal_jazz.png";
import freeJazzIcon from "../assets/icons/free_jazz.png";
import fusionIcon from "../assets/icons/fusion.png";
import modernJazzIcon from "../assets/icons/modern_jazz.png";

// Fixed accent per genre/era — used consistently for the genre badge fill,
// the timeline card's left-edge accent, and (via GENRE_ICONS) icon color.
export const GENRE_COLORS: Record<Genre, string> = {
  Ragtime: "#c9a24a",
  "New Orleans": "#c1543a",
  Chicago: "#d4941f",
  Swing: "#e8c766",
  Bebop: "#8c2f2f",
  "Cool Jazz": "#4a8ca8",
  "Vocal Jazz": "#d9a6a6",
  "Hard Bop": "#c1560c",
  "Modal Jazz": "#6a4fa0",
  "Free Jazz": "#e0e0e0",
  Fusion: "#2fb8a8",
  "Modern Jazz": "#c7c7c7",
};

// Fusion is the one genre with a two-tone identity; every other genre is a
// solid fill. Used for badge backgrounds specifically.
export const GENRE_BACKGROUNDS: Record<Genre, string> = {
  ...GENRE_COLORS,
  Fusion: "linear-gradient(135deg, #2fb8a8, #d13fa0)",
};

export const GENRE_ICONS: Record<Genre, string> = {
  Ragtime: ragtimeIcon,
  "New Orleans": newOrleansIcon,
  Chicago: chicagoIcon,
  Swing: swingIcon,
  Bebop: bebopIcon,
  "Cool Jazz": coolJazzIcon,
  "Vocal Jazz": vocalJazzIcon,
  "Hard Bop": hardBopIcon,
  "Modal Jazz": modalJazzIcon,
  "Free Jazz": freeJazzIcon,
  Fusion: fusionIcon,
  "Modern Jazz": modernJazzIcon,
};

// WCAG relative luminance + contrast ratio, so each genre's badge text picks
// whichever of dark-ink/cream actually contrasts better against that fill —
// a fixed lightness cutoff mis-classified several mid-tone colors (e.g.
// Ragtime, Hard Bop) where dark text was clearly the stronger choice.
function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(l1: number, l2: number): number {
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const DARK_TEXT = "#1a120e";
const LIGHT_TEXT = "#f4ead9";
const DARK_TEXT_LUMINANCE = relativeLuminance(DARK_TEXT);
const LIGHT_TEXT_LUMINANCE = relativeLuminance(LIGHT_TEXT);

export function genreTextColor(genre: Genre): string {
  const fillLuminance = relativeLuminance(GENRE_COLORS[genre]);
  const vsDark = contrastRatio(fillLuminance, DARK_TEXT_LUMINANCE);
  const vsLight = contrastRatio(fillLuminance, LIGHT_TEXT_LUMINANCE);
  return vsDark >= vsLight ? DARK_TEXT : LIGHT_TEXT;
}

export function genreColorStyle(genre: Genre): CSSProperties {
  return {
    "--genre-color": GENRE_COLORS[genre],
    "--genre-bg": GENRE_BACKGROUNDS[genre],
    "--genre-text": genreTextColor(genre),
    // Used to tint the badge icon via mask-image (see .genre-badge-icon):
    // the icon is recolored to match --genre-text, guaranteeing it always
    // contrasts against the fill instead of fighting its own baked-in hue.
    "--genre-icon": `url(${GENRE_ICONS[genre]})`,
  } as CSSProperties;
}
