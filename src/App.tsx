import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense, lazy } from "react";

// Lazy-loaded pages
const SimpleAuth = lazy(() => import("@/features/auth/pages/SimpleAuth"));
const Oversikt = lazy(() => import("@/pages/Oversikt"));
const Eiendommer = lazy(() => import("@/pages/Eiendommer"));
const Kontrakter = lazy(() => import("@/pages/Kontrakter"));
const Okonomi = lazy(() => import("@/pages/Okonomi"));
const Innstillinger = lazy(() => import("@/pages/Innstillinger"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const LeaseSignature = lazy(() => import("@/features/signing/pages/LeaseSignature"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/oversikt" replace />} />
              <Route path="/auth" element={<SimpleAuth />} />
              <Route path="/oversikt" element={<Oversikt />} />
              <Route path="/eiendommer" element={<Eiendommer />} />
              <Route path="/kontrakter" element={<Kontrakter />} />
              <Route path="/okonomi" element={<Okonomi />} />
              <Route path="/innstillinger" element={<Innstillinger />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/lease/:leaseId/signature" element={<LeaseSignature />} />
              <Route path="*" element={<Navigate to="/oversikt" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
