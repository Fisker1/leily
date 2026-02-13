import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useEffect } from "react";
import ComingSoon from "./pages/ComingSoon";
import { APP_CONFIG, isProduction, FEATURES } from "@/shared/lib/env";
import CookieConsent from "@/features/legal/components/CookieConsent";

// Coming soon logic: show for production only (unless explicitly disabled)
const SHOULD_SHOW_COMING_SOON = isProduction && APP_CONFIG.comingSoon;

// Debug logging for staging only
if (typeof window !== 'undefined' && FEATURES.debug) {
  console.info('Environment config:', { 
    comingSoon: APP_CONFIG.comingSoon,
    shouldShow: SHOULD_SHOW_COMING_SOON 
  });
}

// Lazy load all pages for better performance
const Index = lazy(() => import("@/features/marketing/pages/Index"));
const SimpleAuth = lazy(() => import("@/features/auth/pages/SimpleAuth"));
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const AdminDashboard = lazy(() => import("@/features/admin/pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
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
const EnvDebug = lazy(() => import("./pages/debug/__env"));
const Health = lazy(() => import("./pages/debug/__health"));
const SupabaseInfo = lazy(() => import("./pages/debug/__supabase"));
const LeaseSignature = lazy(() => import("@/features/signing/pages/LeaseSignature"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

// Force light theme initialization
const ForceDefaultTheme = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Force light theme on mount if no theme is stored
    const storedTheme = localStorage.getItem('leily-theme');
    if (!storedTheme) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('leily-theme', 'light');
    }
  }, []);

  return <>{children}</>;
};

const App = () => {
  // Show coming soon page for production environment when flag is enabled
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
                    <Route path="/calculator" element={<Calculator />} />
                    <Route path="/calculator/risk-analysis" element={<RiskAnalysis />} />
                    <Route path="/calculator/extended-details" element={<ExtendedPropertyDetails />} />
                    <Route path="/bank-report" element={<BankReport />} />
                    <Route path="/min-side" element={<MyProfile />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/lease/:leaseId/signature" element={<LeaseSignature />} />
                    {/* Debug routes — hidden in production */}
                    {!isProduction && (
                      <>
                        <Route path="/__env" element={<EnvDebug />} />
                        <Route path="/__health" element={<Health />} />
                        <Route path="/__supabase" element={<SupabaseInfo />} />
                      </>
                    )}
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
