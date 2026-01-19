import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { OnboardingProvider } from "@/components/OnboardingProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Bridge from "./pages/Bridge";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Transfer from "./pages/Transfer";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OnboardingProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/bridge" element={<Bridge />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/transfer" element={<Transfer />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </OnboardingProvider>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
