import { useEffect } from "react";
import posterImage from "../assets/jazz-poster.png";

interface Props {
  onStart: () => void;
}

const AUTO_ADVANCE_MS = 5000;

export function SplashScreen({ onStart }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onStart, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [onStart]);

  return (
    <div className="screen splash-screen" onClick={onStart}>
      <h1>Jazz Timeline</h1>
      <img className="splash-poster" src={posterImage} alt="Jazz Timeline poster" />
      <p className="splash-credit">by Alex Rueß</p>
    </div>
  );
}
