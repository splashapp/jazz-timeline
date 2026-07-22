import { useState } from "react";

interface Props {
  min: number;
  max: number;
  onCommit: (year: number) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Full-width year slider, bounded by the two cards neighboring the gap
// already locked in during placement (Scene 7) — replaces the old per-gap
// picker now that placement and year are separately committed steps.
// Release commits directly, same "letting go = confirming" principle as
// the placement drag itself.
export function YearCorridor({ min, max, onCommit }: Props) {
  const [year, setYear] = useState(() => Math.round((min + max) / 2));

  const yearFromPointer = (clientX: number, track: HTMLElement) => {
    const rect = track.getBoundingClientRect();
    const fraction = rect.width === 0 ? 0 : clamp((clientX - rect.left) / rect.width, 0, 1);
    return max === min ? min : Math.round(min + fraction * (max - min));
  };

  const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setYear(yearFromPointer(e.clientX, e.currentTarget));
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    setYear(yearFromPointer(e.clientX, e.currentTarget));
  };

  const handleUp = () => {
    onCommit(year);
  };

  const fraction = max === min ? 0 : (year - min) / (max - min);

  return (
    <div className="year-corridor">
      <div className="year-corridor-value">{year}</div>
      <div
        className="year-corridor-track"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        role="slider"
        aria-label="Choose release year"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={year}
      >
        <div className="year-corridor-fill" style={{ width: `${fraction * 100}%` }} />
        <div className="year-corridor-thumb" style={{ left: `${fraction * 100}%` }} />
      </div>
      <div className="year-corridor-labels">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
