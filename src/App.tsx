import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { CustomCursor } from "@/components/effects/CustomCursor";
import { AmbientBackground } from "@/components/effects/AmbientBackground";
import Landing from "./pages/Landing";
import ModeSelection from "./pages/ModeSelection";
import TeachingDashboard from "./pages/TeachingDashboard";
import LearningDashboard from "./pages/LearningDashboard";
import Credits from "./pages/Credits";
import Sessions from "./pages/Sessions";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ModeProvider>
        <TooltipProvider>
          <CustomCursor />
          <AmbientBackground />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/mode" element={<ModeSelection />} />
              <Route path="/teaching" element={<TeachingDashboard />} />
              <Route path="/learning" element={<LearningDashboard />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ModeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
