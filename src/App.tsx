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

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [onboardingView, setOnboardingView] = useState<"start" | "multiplayer">("start");
  const [mockMode, setMockMode] = useState(false);
  const mediaService = mockMode ? "mock" : "youtube";

  // Owned here (not inside GameScreen) so the player already exists — and
  // can be prefetching/cueing the first song — while still on the splash
  // screen, which is what lets "Play Solo"/"Start Game" trigger that song
  // synchronously within their own click instead of needing a separate
  // "Play Song" button once the game screen mounts.
  const music = useMusicPlayback(mediaService, state, dispatch);

  if (isDebugView) {
    return (
      <div className="app">
        <DebugPanel />
      </div>
    );
  }

  const startGame = (playerNames: string[]) => {
    // START_GAME first: it resets usedSongIds/turnPhase/currentSong, which
    // would otherwise clobber the DRAW_SONG that playFirstSongSync
    // dispatches. Both calls are still synchronous within this same click.
    dispatch({ type: "START_GAME", mediaService, playerNames });
    music.playFirstSongSync();
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
