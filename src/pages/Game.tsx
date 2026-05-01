import { useParams, Navigate } from "react-router-dom";
import QuizGame from "./games/QuizGame";
import MemoryGame from "./games/MemoryGame";
import BalloonGame from "./games/BalloonGame";
import TreasureGame from "./games/TreasureGame";
import RunnerGame from "./games/RunnerGame";

const GAMES = ["memory", "balloon", "treasure", "runner", "quiz"] as const;

const Game = () => {
  const { gameId } = useParams<{ gameId: string }>();
  if (!GAMES.includes(gameId as typeof GAMES[number])) return <Navigate to="/oyunlar" replace />;

  switch (gameId) {
    case "memory": return <MemoryGame />;
    case "balloon": return <BalloonGame />;
    case "treasure": return <TreasureGame />;
    case "runner": return <RunnerGame />;
    case "quiz": return <QuizGame />;
    default: return <Navigate to="/oyunlar" replace />;
  }
};

export default Game;
