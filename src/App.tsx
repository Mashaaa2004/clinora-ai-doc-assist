import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppPage from "./pages/AppPage.tsx";
import Auth from "./pages/Auth.tsx";
import Analytics from "./pages/Analytics.tsx";
import Profile from "./pages/Profile.tsx";
import History from "./pages/History.tsx";
import Pricing from "./pages/Pricing.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Verify from "./pages/Verify.tsx";
import PatientRoute from "@/components/PatientRoute";
import PatientDashboard from "./pages/patient/PatientDashboard.tsx";
import NewRequest from "./pages/patient/NewRequest.tsx";
import MyRequests from "./pages/patient/MyRequests.tsx";
import PatientProfile from "./pages/patient/PatientProfile.tsx";
import Notifications from "./pages/patient/Notifications.tsx";
import Queue from "./pages/Queue.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/verify/:id" element={<Verify />} />
            <Route path="/patient" element={<PatientRoute><PatientDashboard /></PatientRoute>} />
            <Route path="/patient/new" element={<PatientRoute><NewRequest /></PatientRoute>} />
            <Route path="/patient/requests" element={<PatientRoute><MyRequests /></PatientRoute>} />
            <Route path="/patient/profile" element={<PatientRoute><PatientProfile /></PatientRoute>} />
            <Route path="/patient/notifications" element={<PatientRoute><Notifications /></PatientRoute>} />
            <Route path="/queue" element={<ProtectedRoute><Queue /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
