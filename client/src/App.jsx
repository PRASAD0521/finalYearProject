import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Labs from './pages/Labs';
import Profile from './pages/Profile';
import Lab1 from './pages/labs/Lab1_SQLi';
import Lab2 from './pages/labs/Lab2_XSS';
import Lab3 from './pages/labs/Lab3_BrokenAuth';
import Lab4 from './pages/labs/Lab4_Misconfig';
import Playground from './pages/Playground';
import LabReport from './pages/LabReport';

// Simple Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthLayout />}>
              <Route index element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="labs" element={<Labs />} />
              <Route path="profile" element={<Profile />} />
              <Route path="/simulation/lab-01" element={<Lab1 />} />
              <Route path="/simulation/lab-02" element={<Lab2 />} />
              <Route path="/simulation/lab-03" element={<Lab3 />} />
              <Route path="/simulation/lab-04" element={<Lab4 />} />
              <Route path="/lab-report/:id" element={<LabReport />} />
              <Route path="playground" element={<Playground />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ProgressProvider>
    </AuthProvider>
  );
}
