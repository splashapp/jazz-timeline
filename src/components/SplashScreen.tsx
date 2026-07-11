import posterImage from "../assets/jazz-poster.png";

interface Props {
  onSolo: () => void;
  onMultiplayer: () => void;
}

export function SplashScreen({ onSolo, onMultiplayer }: Props) {
  return (
    <div className="screen splash-screen">
      <h1>Jazz Timeline</h1>
      <img className="splash-poster" src={posterImage} alt="Jazz Timeline poster" />
      <p className="splash-credit">by Alex Rueß</p>
      <button className="pill-btn primary splash-solo-btn" onClick={onSolo}>
        ▶ Play Solo
      </button>
      <button className="link-btn" onClick={onMultiplayer}>
        With Multiple Players →
      </button>
    </div>
  );
}
