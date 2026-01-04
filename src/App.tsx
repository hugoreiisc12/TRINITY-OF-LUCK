import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import Index from "./pages/Index";
import Analysis from "./pages/Analysis";
import Results from "./pages/Results";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Plans from "./pages/Plans";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/" element={<ProtectedRoute children={<Index />} />} />
            <Route path="/analysis" element={<ProtectedRoute children={<Analysis />} />} />
            <Route path="/results" element={<ProtectedRoute children={<Results />} />} />
            <Route path="/history" element={<ProtectedRoute children={<History />} />} />
            <Route path="/settings" element={<ProtectedRoute children={<Settings />} />} />
            <Route path="/plans" element={<ProtectedRoute children={<Plans />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
