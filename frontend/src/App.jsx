import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ReportIssuePage from './pages/ReportIssuePage';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GISMapPage from './pages/GISMapPage';
import IssueDetailPage from './pages/IssueDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AuditLogsPage from './pages/AuditLogsPage';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-civic-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If citizen tries to access admin, bounce to citizen dashboard
    if (user.role === 'citizen') return <Navigate to="/citizen" replace />;
    if (user.role === 'officer') return <Navigate to="/officer" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <div className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/map" element={<GISMapPage />} />
          <Route path="/report" element={<ReportIssuePage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />

          {/* Citizen Protected Routes */}
          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          {/* Officer Protected Routes */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={['officer', 'admin']}>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/issues"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
};

export default App;
