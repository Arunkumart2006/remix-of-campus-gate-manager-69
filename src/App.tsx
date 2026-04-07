import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppRole, AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";

// ✅ ADD THIS (NEW HOME PAGE)
import Home from "@/pages/Home";

import Dashboard from "@/pages/Dashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import ManageAccounts from "@/pages/ManageAccounts";
import BusEntry from "@/pages/BusEntry";
import Outpass from "@/pages/Outpass";
import Visitors from "@/pages/Visitors";
import Records from "@/pages/Records";
import Payments from "@/pages/Payments";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 🔒 If not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // 🔒 Role check
  if (allowedRoles && role && !allowedRoles.includes(role as AppRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      {/* ✅ PUBLIC HOME PAGE */}
      <Route path="/" element={<Home />} />

      {/* ✅ LOGIN PAGE */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* ✅ DASHBOARD (PROTECTED) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {role === "admin" ? (
              <Navigate to="/manage-accounts" replace />
            ) : role === "student" ? (
              <Navigate to="/student-dashboard" replace />
            ) : (
              <Dashboard />
            )}
          </ProtectedRoute>
        }
      />

      {/* ✅ OTHER PROTECTED ROUTES */}
      <Route
        path="/manage-accounts"
        element={
          <ProtectedRoute allowedRoles={["admin", "md", "principal", "hod", "staff"]}>
            <ManageAccounts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bus-entry"
        element={
          <ProtectedRoute allowedRoles={["watchman"]}>
            <BusEntry />
          </ProtectedRoute>
        }
      />

      <Route
        path="/outpass"
        element={
          <ProtectedRoute
            allowedRoles={["md", "principal", "hod", "staff", "watchman"]}
          >
            <Outpass />
          </ProtectedRoute>
        }
      />

      <Route
        path="/visitors"
        element={
          <ProtectedRoute allowedRoles={["watchman"]}>
            <Visitors />
          </ProtectedRoute>
        }
      />

      <Route
        path="/records"
        element={
          <ProtectedRoute
            allowedRoles={["md", "principal", "hod", "staff", "watchman"]}
          >
            <Records />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Payments />
          </ProtectedRoute>
        }
      />

      {/* ❌ NOT FOUND */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
