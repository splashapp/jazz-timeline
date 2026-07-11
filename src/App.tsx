import { useReducer, useState } from "react";
import { gameReducer, createInitialState } from "./state/gameReducer";
import { SplashScreen } from "./components/SplashScreen";
import { PlayerSetupScreen } from "./components/PlayerSetupScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import { DebugPanel } from "./components/DebugPanel";
import "./App.css";

const isDebugView = new URLSearchParams(window.location.search).has("debug");

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [onboardingView, setOnboardingView] = useState<"start" | "multiplayer">("start");

  if (isDebugView) {
    return (
      <div className="app">
        <DebugPanel />
      </div>
    );
  }

  return (
    <div className="app">
      {state.phase === "setup-media" && onboardingView === "start" && (
        <SplashScreen
          onSolo={() =>
            dispatch({ type: "START_GAME", mediaService: "youtube", playerNames: ["Player 1"] })
          }
          onMultiplayer={() => setOnboardingView("multiplayer")}
        />
      )}
      {state.phase === "setup-media" && onboardingView === "multiplayer" && (
        <PlayerSetupScreen
          onBack={() => setOnboardingView("start")}
          onStart={(names) =>
            dispatch({ type: "START_GAME", mediaService: "youtube", playerNames: names })
          }
        />
      )}
      {state.phase === "playing" && <GameScreen state={state} dispatch={dispatch} />}
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
