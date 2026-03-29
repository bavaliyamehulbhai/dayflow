import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SecurityProvider } from './context/SecurityGuard';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import HabitsPage from './pages/HabitsPage';
import SchedulePage from './pages/SchedulePage';
import PomodoroPage from './pages/PomodoroPage';
import NotesPage from './pages/NotesPage';
import ProfilePage from './pages/ProfilePage';
import { useZenTheme } from './hooks/useZenTheme';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false
    }
  }
});

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
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
  if (loading) return <div className="splash"><div className="splash-logo">DayFlow</div></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    style={{ height: '100%', width: '100%' }}
  >
    {children}
  </motion.div>
);

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PublicRoute><PageWrapper><LoginPage /></PageWrapper></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><PageWrapper><RegisterPage /></PageWrapper></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><PageWrapper><DashboardPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><PageWrapper><TasksPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><PageWrapper><HabitsPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><PageWrapper><SchedulePage /></PageWrapper></ProtectedRoute>} />
        <Route path="/pomodoro" element={<ProtectedRoute><PageWrapper><PomodoroPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><PageWrapper><NotesPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageWrapper><ProfilePage /></PageWrapper></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  useZenTheme(); // Initialize theme

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SecurityProvider>
            <BrowserRouter>
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#1a1a26',
                    color: '#e8e8f0',
                    border: '1px solid #2a2a3d',
                    borderRadius: '10px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '13px'
                  },
                  success: { iconTheme: { primary: '#6dfacc', secondary: '#0a0a0f' } },
                  error: { iconTheme: { primary: '#fa6d6d', secondary: '#0a0a0f' } }
                }}
              />
            </BrowserRouter>
          </SecurityProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

