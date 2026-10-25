import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { PublicLanding } from './pages/PublicLanding';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Security } from './pages/Security';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Trainers } from './pages/Trainers';
import { MembershipPlans } from './pages/MembershipPlans';
import { Subscriptions } from './pages/Subscriptions';
import { Payments } from './pages/Payments';
import { Attendance } from './pages/Attendance';
import { WorkoutPlans } from './pages/WorkoutPlans';
import { MemberProgress } from './pages/MemberProgress';
import { Profile } from './pages/Profile';
import { SetPassword } from './pages/SetPassword';

// Route protector ensuring user is authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8F8F6' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #E8E5DC', borderTopColor: '#C9A227', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Strict Role-Based Route Guard preventing unauthorized cross-role dashboard access
const RoleRoute = ({ allowedRoles, children }) => {
  const { user, role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #E8E5DC', borderTopColor: '#C9A227', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const currentRole = String(role || user.role || user.user_role || 'Member').trim().toLowerCase();

  // Owners have administrative access to all views
  if (currentRole === 'owner') {
    return children;
  }

  // Check if role is allowed
  const isAllowed = (allowedRoles || []).some(r => r.toLowerCase() === currentRole);

  if (!isAllowed) {
    // Redirect to the user's authentic role dashboard
    if (currentRole === 'trainer') return <Navigate to="/dashboard/trainer" replace />;
    if (currentRole === 'staff' || currentRole === 'manager') return <Navigate to="/dashboard/staff" replace />;
    return <Navigate to="/dashboard/member" replace />;
  }

  return children;
};

// Use HashRouter for flawless compatibility with Catalyst static client hosting & Slate routing
export const App = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <Routes>
          {/* Public Pages */}
          <Route path="/" element={<PublicLanding />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/security" element={<Security />} />

          {/* Protected Role-Based Application Shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Exact Role Dashboard Routes */}
            <Route path="/dashboard" element={<RoleRoute allowedRoles={['Owner']}><Dashboard /></RoleRoute>} />
            <Route path="/dashboard/trainer" element={<RoleRoute allowedRoles={['Trainer']}><Dashboard forcedRole="Trainer" /></RoleRoute>} />
            <Route path="/dashboard/member" element={<RoleRoute allowedRoles={['Member']}><Dashboard forcedRole="Member" /></RoleRoute>} />
            <Route path="/dashboard/staff" element={<RoleRoute allowedRoles={['Staff']}><Dashboard forcedRole="Staff" /></RoleRoute>} />

            {/* Legacy Dashboard Aliases */}
            <Route path="/trainer-dashboard" element={<Navigate to="/dashboard/trainer" replace />} />
            <Route path="/member-dashboard" element={<Navigate to="/dashboard/member" replace />} />
            <Route path="/staff-dashboard" element={<Navigate to="/dashboard/staff" replace />} />

            {/* Admin & Operations Routes */}
            <Route path="/members" element={<RoleRoute allowedRoles={['Owner', 'Staff', 'Trainer']}><Members /></RoleRoute>} />
            <Route path="/trainers" element={<RoleRoute allowedRoles={['Owner', 'Staff']}><Trainers /></RoleRoute>} />
            <Route path="/plans" element={<RoleRoute allowedRoles={['Owner', 'Staff', 'Member']}><MembershipPlans /></RoleRoute>} />
            <Route path="/subscriptions" element={<RoleRoute allowedRoles={['Owner', 'Staff', 'Member']}><Subscriptions /></RoleRoute>} />
            <Route path="/payments" element={<RoleRoute allowedRoles={['Owner', 'Staff']}><Payments /></RoleRoute>} />
            <Route path="/attendance" element={<RoleRoute allowedRoles={['Owner', 'Staff', 'Trainer', 'Member']}><Attendance /></RoleRoute>} />
            <Route path="/workouts" element={<WorkoutPlans />} />
            <Route path="/progress" element={<MemberProgress />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  </ErrorBoundary>
  );
};

export default App;
