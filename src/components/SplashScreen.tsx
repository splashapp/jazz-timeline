import posterImage from "../assets/Title_Alex_01.png";

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
      <img className="splash-poster" src={posterImage} alt="Jazz Timeline poster" />
      <p className="splash-credit">by Alex Rueß</p>
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
