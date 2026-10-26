import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar from './components/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StaffDashboard from './pages/staff/StaffDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import DisplayBoard from './pages/display/DisplayBoard';
import Kiosk from './pages/kiosk/Kiosk';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return <div className="p-8 text-center text-slate-500 font-semibold">Loading App...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/staff'} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Public Display & Kiosk routes */}
                <Route path="/display/:serviceCentreId" element={<DisplayBoard />} />
                <Route path="/kiosk" element={<Kiosk />} />

                {/* Staff Dashboard Route */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Dashboard Route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/staff" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
