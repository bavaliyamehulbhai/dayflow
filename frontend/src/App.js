import React, { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SecurityProvider } from "./context/SecurityGuard";
import { NotificationProvider, useNotifications } from "./context/NotificationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import ToastContainer from "./components/common/ToastContainer";
import { useZenTheme } from "./hooks/useZenTheme";
import "./styles/globals.css";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const HabitsPage = lazy(() => import("./pages/HabitsPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const PomodoroPage = lazy(() => import("./pages/PomodoroPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="splash">
        <div className="splash-logo">DayFlow</div>
        <div className="splash-tagline">Your productivity, elevated</div>
        <div className="splash-loader" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="splash">
        <div className="splash-logo">DayFlow</div>
      </div>
    );
  if (user) return <Navigate to="/" replace />;
  return children;
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    style={{ height: "100%", width: "100%" }}
  >
    {children}
  </motion.div>
);



function AppRoutes() {
  const location = useLocation();
  const { addToast } = useNotifications();

  useEffect(() => {
    const handleUpdate = () => {
      addToast("Update available! Please refresh the page.", "info", 10000);
    };
    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, [addToast]);

  return (
    <Suspense fallback={
      <div className="splash">
        <div className="splash-logo">DayFlow</div>
        <div className="splash-loader" />
      </div>
    }>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <PageWrapper>
                <LoginPage />
              </PageWrapper>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <PageWrapper>
                <RegisterPage />
              </PageWrapper>
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <DashboardPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <TasksPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <HabitsPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <SchedulePage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pomodoro"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <PomodoroPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <NotesPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <NotificationsPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <ProfilePage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default function App() {
  useZenTheme(); // Initialize theme

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <AuthProvider>
            <SecurityProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <AppRoutes />
                <ToastContainer />
              </BrowserRouter>
            </SecurityProvider>
          </AuthProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
