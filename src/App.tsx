import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import SimpleAuth from "./pages/SimpleAuth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import Rental from "./pages/Rental";
import Portfolio from "./pages/Portfolio";
import Calculator from "./pages/Calculator";
import RiskAnalysis from "./pages/calculator/RiskAnalysis";
import ExtendedPropertyDetails from "./pages/calculator/ExtendedPropertyDetails";
import BankReport from "./pages/BankReport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<SimpleAuth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/utleie" element={<Rental />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/calculator/risk-analysis" element={<RiskAnalysis />} />
              <Route path="/calculator/extended-details" element={<ExtendedPropertyDetails />} />
              <Route path="/bank-report" element={<BankReport />} />
              <Route path="/admin" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
