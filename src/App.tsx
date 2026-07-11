import { useReducer } from "react";
import { gameReducer, createInitialState } from "./state/gameReducer";
import { MediaSelectScreen } from "./components/MediaSelectScreen";
import { PlayerSetupScreen } from "./components/PlayerSetupScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import "./App.css";

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  return (
    <div className="app">
      {state.phase === "setup-media" && (
        <MediaSelectScreen onSelect={(service) => dispatch({ type: "SELECT_MEDIA", service })} />
      )}
      {state.phase === "setup-players" && (
        <PlayerSetupScreen onStart={(names) => dispatch({ type: "START_GAME", playerNames: names })} />
      )}
      {state.phase === "playing" && <GameScreen state={state} dispatch={dispatch} />}
      {state.phase === "finished" && (
        <ResultScreen state={state} onRestart={() => dispatch({ type: "RESET" })} />
      )}
    </div>
  );
}

export default App;
