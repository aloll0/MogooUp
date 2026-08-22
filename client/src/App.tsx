import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Login } from "./features/auth/Login";
import { Register } from "./features/auth/Register";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { ToastContainer } from "./components/ToastContainer";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { useToastStore } from "./stores/useToastStore";

// Initialize TanStack Query Client with optimal defaults for project management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      useToastStore.getState().addToast(event.message || "An unexpected error occurred", "error");
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.response?.data?.error?.message || event.reason?.message || String(event.reason) || "Promise rejection error";
      useToastStore.getState().addToast(msg, "error");
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/w/:workspaceId" element={<Dashboard />} />
                <Route path="/w/:workspaceId/space/:spaceId" element={<Dashboard />} />
                <Route path="/w/:workspaceId/:tab" element={<Dashboard />} />
                <Route path="/admin" element={<Dashboard />} />
              </Route>

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
          <ConfirmDialog />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
