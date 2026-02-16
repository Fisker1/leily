import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useEffect } from "react";
import ComingSoon from "@/features/marketing/pages/ComingSoon";
import { APP_CONFIG, isProduction } from "@/shared/lib/env";
import CookieConsent from "@/features/legal/components/CookieConsent";

const SHOULD_SHOW_COMING_SOON = isProduction && APP_CONFIG.comingSoon;

// Lazy-loaded pages
const Index = lazy(() => import("@/features/marketing/pages/Index"));
const SimpleAuth = lazy(() => import("@/features/auth/pages/SimpleAuth"));
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const AdminDashboard = lazy(() => import("@/features/admin/pages/AdminDashboard"));
const NotFound = lazy(() => import("@/shared/components/NotFound"));
const Rental = lazy(() => import("@/features/rental/pages/Rental"));
const Portfolio = lazy(() => import("@/features/rental/pages/Portfolio"));
const Calculator = lazy(() => import("@/features/calculator/pages/Calculator"));
const RiskAnalysis = lazy(() => import("@/features/calculator/pages/RiskAnalysis"));
const ExtendedPropertyDetails = lazy(() => import("@/features/calculator/pages/ExtendedPropertyDetails"));
const BankReport = lazy(() => import("@/features/calculator/pages/BankReport"));
const MyProfile = lazy(() => import("@/features/profile/pages/MyProfile"));
const UtleieAgent = lazy(() => import("@/features/ai/pages/UtleieAgent"));
const Agent007 = lazy(() => import("@/features/ai/pages/Agent007"));
const CreditsPurchasePage = lazy(() => import("@/features/credits/pages/CreditsPurchasePage"));
const Terms = lazy(() => import("@/features/legal/pages/Terms"));
const Privacy = lazy(() => import("@/features/legal/pages/Privacy"));
const Cookies = lazy(() => import("@/features/legal/pages/Cookies"));
const LeaseSignature = lazy(() => import("@/features/signing/pages/LeaseSignature"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const queryClient = new QueryClient();

const ForceDefaultTheme = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const storedTheme = localStorage.getItem('leily-theme');
    if (!storedTheme) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('leily-theme', 'light');
    }
  }, []);
  return <>{children}</>;
};

const App = () => {
  if (SHOULD_SHOW_COMING_SOON) {
    return <ComingSoon />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
        storageKey="leily-theme"
      >
        <ForceDefaultTheme>
          <TooltipProvider>
            <LanguageProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <CookieConsent />
                <BrowserRouter>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<SimpleAuth />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/utleie" element={<Rental />} />
                      <Route path="/utleie-agent" element={<UtleieAgent />} />
                      <Route path="/agent-007" element={<Agent007 />} />
                      <Route path="/credits" element={<CreditsPurchasePage />} />
                      <Route path="/portfolio" element={<Portfolio />} />
                      <Route path="/kalkulator" element={<Calculator />} />
                      <Route path="/kalkulator/risk-analysis" element={<RiskAnalysis />} />
                      <Route path="/kalkulator/extended-details" element={<ExtendedPropertyDetails />} />
                      <Route path="/bank-report" element={<BankReport />} />
                      <Route path="/min-side" element={<MyProfile />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/cookies" element={<Cookies />} />
                      <Route path="/lease/:leaseId/signature" element={<LeaseSignature />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </AuthProvider>
            </LanguageProvider>
          </TooltipProvider>
        </ForceDefaultTheme>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
