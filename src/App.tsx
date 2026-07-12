import { useReducer, useState } from "react";
import { gameReducer, createInitialState } from "./state/gameReducer";
import { SplashScreen } from "./components/SplashScreen";
import { PlayerSetupScreen } from "./components/PlayerSetupScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import { DebugPanel } from "./components/DebugPanel";
import { useMusicPlayback } from "./hooks/useMusicPlayback";
import "./App.css";

const isDebugView = new URLSearchParams(window.location.search).has("debug");
// Default to mock mode on localhost only — real deployments (Vercel, etc.)
// still default to the real YouTube service regardless of build mode.
const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [onboardingView, setOnboardingView] = useState<"start" | "multiplayer">("start");
  const [mockMode, setMockMode] = useState(isLocalhost);
  const mediaService = mockMode ? "mock" : "youtube";

  // Owned here (not inside GameScreen) so the single player instance
  // persists across the whole app rather than being torn down/recreated
  // between screens.
  const music = useMusicPlayback(mediaService, state, dispatch);

  if (isDebugView) {
    return (
      <div className="app">
        <DebugPanel />
      </div>
    );
  }

  const startGame = (playerNames: string[]) => {
    dispatch({ type: "START_GAME", mediaService, playerNames });
  };

  return (
    <div className="app">
      <div id="youtube-player-container" className="yt-hidden" />
      {mockMode && state.phase === "playing" && <span className="mock-badge">🧪 Mock mode</span>}

      {state.phase === "setup-media" && onboardingView === "start" && (
        <SplashScreen
          onSolo={() => startGame(["Player 1"])}
          onMultiplayer={() => setOnboardingView("multiplayer")}
          mockMode={mockMode}
          onToggleMock={() => setMockMode((m) => !m)}
        />
      )}
      {state.phase === "setup-media" && onboardingView === "multiplayer" && (
        <PlayerSetupScreen onBack={() => setOnboardingView("start")} onStart={startGame} />
      )}
      {state.phase === "playing" && <GameScreen state={state} dispatch={dispatch} music={music} />}
      {state.phase === "finished" && (
        <ResultScreen
          state={state}
          onRestart={() => {
            setOnboardingView("start");
            dispatch({ type: "RESET" });
          }}
        />
      )}
    </div>
  );
}

export default App;
