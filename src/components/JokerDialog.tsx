import { useState } from "react";

interface Props {
  jokersRemaining: number;
  yearEligible: boolean;
  artistOptions: string[];
  onUseYear: () => void;
  onUseArtist: (guess: string) => void;
  onSkip: () => void;
}

// Scene 8's risk/reward gate — reached only when the year corridor was
// wide enough to make a guess meaningful and the player still has jokers.
// Deliberately placed after both placement and the year guess: the player
// already knows their corridor and can judge their own risk.
export function JokerDialog({
  jokersRemaining,
  yearEligible,
  artistOptions,
  onUseYear,
  onUseArtist,
  onSkip,
}: Props) {
  const [showArtistOptions, setShowArtistOptions] = useState(false);

  if (showArtistOptions) {
    return (
      <div className="joker-dialog">
        <p className="joker-dialog-header">Who played it?</p>
        <div className="joker-artist-options">
          {artistOptions.map((name) => (
            <button
              key={name}
              type="button"
              className="joker-artist-option"
              onClick={() => onUseArtist(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="link-btn joker-dialog-back"
          onClick={() => setShowArtistOptions(false)}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="joker-dialog">
      <p className="joker-dialog-header">Use a joker? ({jokersRemaining} left)</p>
      <div className="joker-options">
        <button type="button" className="joker-option" disabled={!yearEligible} onClick={onUseYear}>
          <span className="joker-option-title">Year</span>
          <span className="joker-option-sub">×2 points</span>
        </button>
        <button type="button" className="joker-option" onClick={() => setShowArtistOptions(true)}>
          <span className="joker-option-title">Artist</span>
          <span className="joker-option-sub">5 options</span>
        </button>
      </div>
      <button type="button" className="link-btn joker-dialog-skip" onClick={onSkip}>
        Without →
      </button>
    </div>
  );
}
