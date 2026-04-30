import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Topics from "./pages/Topics.tsx";
import Games from "./pages/Games.tsx";
import Progress from "./pages/Progress.tsx";
import Quiz from "./pages/Quiz.tsx";
import MemoryGame from "./pages/games/MemoryGame.tsx";
import CandyGame from "./pages/games/CandyGame.tsx";
import RaceGame from "./pages/games/RaceGame.tsx";
import BalloonGame from "./pages/games/BalloonGame.tsx";
import TreasureGame from "./pages/games/TreasureGame.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/games" element={<Games />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/quiz/:topicId" element={<Quiz />} />
          <Route path="/games/memory" element={<MemoryGame />} />
          <Route path="/games/candy" element={<CandyGame />} />
          <Route path="/games/race" element={<RaceGame />} />
          <Route path="/games/balloon" element={<BalloonGame />} />
          <Route path="/games/treasure" element={<TreasureGame />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
