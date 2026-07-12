import posterImage from "../assets/davinci_a_poster_style_illustrated_portrait_composition_fe.png";
import { DECKS } from "../data/decks";

interface Props {
  onSolo: () => void;
  onMultiplayer: () => void;
  mockMode: boolean;
  onToggleMock: () => void;
}

export function SplashScreen({ onSolo, onMultiplayer, mockMode, onToggleMock }: Props) {
  return (
    <div className="screen splash-screen">
      <h1 className="brand-title">Jazz Timeline</h1>
      <div className="splash-poster-frame">
        {/* Echoes the vinyl's concentric grooves (.vinyl background) as a
            recurring motif, bracketing the splash screen visually to the
            turntable/card screens that follow. */}
        <div className="splash-poster-rings" aria-hidden="true" />
        {/* An unfilled, offset outline peeking out behind the photo — hints
            "a stack of cards waiting here" and, since it shares the game
            card's own corner radius, doubles as the "card corner" cue —
            without boxing the photo into the same tight card frame. */}
        <div className="splash-poster-stack" aria-hidden="true" />
        <img className="splash-poster" src={posterImage} alt="Jazz Timeline poster" />
      </div>
      <p className="splash-credit">by Alex Rueß</p>
      {/* Deck picker, below the credit line at half the title's size —
          "Jazz Timeline" above stays the fixed page title; this is purely
          the deck selector. Disabled and single-option today (only one
          deck exists), structurally ready for more entries in DECKS with
          no markup changes needed once a second deck exists. */}
      <div className="deck-select-wrap deck-select-wrap--small">
        <select className="deck-select" disabled defaultValue={DECKS[0].id} aria-label="Deck">
          {DECKS.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.label}
            </option>
          ))}
        </select>
        <svg
          className="deck-select-chevron"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
        >
          <path
            d="M3 6l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <button className="pill-btn primary splash-solo-btn" onClick={onSolo}>
        ▶ Play Solo
      </button>
      <button className="link-btn splash-multiplayer-link" onClick={onMultiplayer}>
        With Multiple Players →
      </button>
      {import.meta.env.DEV && (
        <button className="link-btn dev-mock-toggle" onClick={onToggleMock}>
          🧪 Mock YouTube: {mockMode ? "ON" : "OFF"}
        </button>
      )}
    </div>
  );
}
