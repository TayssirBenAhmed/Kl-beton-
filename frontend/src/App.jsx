import React, { useEffect } from 'react'; // Stable
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './stores/authStore';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Layout
import { AdminSidebar } from './components/layout/AdminSidebar';
import { ChefNavbar } from './components/layout/ChefNavbar';
import { AdminHeader } from './components/layout/AdminHeader';

// Auth pages
import { Login } from './pages/auth/Login';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminEmployes } from './pages/admin/AdminEmployes';
import { AdminAvances } from './pages/admin/AdminAvances';
import { AdminRapports } from './pages/admin/AdminRapports';
import { EmployeeProfile } from './pages/admin/EmployeeProfile';
import { AdminPointageView } from './pages/admin/AdminPointageView';

// Chef pages
import { ChefPointage } from './pages/chef/ChefPointage';
import { ChefHistorique } from './pages/chef/ChefHistorique';
import { ChefAudit } from './pages/chef/ChefAudit';

// Messages
import { Messages } from './pages/messages/Messages';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role?.toUpperCase();
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/chef/pointage'} replace />;
  }
  return children;
};

const AdminLayout = ({ children }) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  return (
    <div className={`min-h-screen industrial-bg flex ${isRTL ? 'flex-row-reverse text-right' : 'flex-row'}`}>
      <AdminSidebar />
      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden ${isRTL ? 'mr-64' : 'ml-64'}`}>
        <AdminHeader />
        <main className="theme-content flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto animate-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const ChefLayout = ({ children }) => {
  const { isDarkMode } = useTheme();
  return (
    <div style={{ minHeight: '100vh', background: isDarkMode ? '#0F172A' : '#F1F5F9', transition: 'background-color 0.2s' }}>
      <ChefNavbar />
      <main className="main-content-chef">{children}</main>
    </div>
  );
};

function AppContent() {
  const { checkAuth, isAuthenticated, user } = useAuth();

  useEffect(() => { checkAuth(); }, []);

  const role = user?.role?.toUpperCase();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/chef/pointage'} replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/employes" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout><AdminEmployes /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/avances" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout><AdminAvances /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/rapports" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout><AdminRapports /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/employee/:id" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout><EmployeeProfile /></AdminLayout>
        </ProtectedRoute>
      } />
     
      <Route path="/admin/pointage" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout><AdminPointageView /></AdminLayout>
        </ProtectedRoute>
      } />

      {/* Chef routes */}
      <Route path="/chef/pointage" element={
        <ProtectedRoute allowedRoles={['CHEF']}>
          <ChefLayout><ChefPointage /></ChefLayout>
        </ProtectedRoute>
      } />
      <Route path="/chef/historique" element={
        <ProtectedRoute allowedRoles={['CHEF']}>
          <ChefLayout><ChefHistorique /></ChefLayout>
        </ProtectedRoute>
      } />
      <Route path="/chef/audit" element={
        <ProtectedRoute allowedRoles={['CHEF']}>
          <ChefLayout><ChefAudit /></ChefLayout>
        </ProtectedRoute>
      } />

      {/* Messages (both roles) */}
      <Route path="/messages" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'CHEF']}>
          {role === 'ADMIN'
            ? <AdminLayout><Messages /></AdminLayout>
            : <ChefLayout><Messages /></ChefLayout>
          }
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <Router>
            <AppContent />
          </Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#14213d',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
              },
              success: { style: { borderLeft: '3px solid #10b981' } },
              error: { style: { borderLeft: '3px solid #ef4444' } },
            }}
          />
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;