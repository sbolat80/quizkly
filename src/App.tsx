import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; 
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n";
import { GameProvider } from "@/context/GameContext";
import GameShell from "@/components/game/GameShell";
import JoinByLink from "./pages/JoinByLink";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <GameProvider>
                  <GameShell />
                </GameProvider>
              }
            />
            <Route path="/join/:code" element={<JoinByLink />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
