import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import PlaygroundLayout from './layouts/PlaygroundLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Labs from './pages/Labs';
import Profile from './pages/Profile';
import Lab1 from './pages/labs/Lab1_SQLi';
import Lab2 from './pages/labs/Lab2_XSS';
import Lab3 from './pages/labs/Lab3_BrokenAuth';
import Lab4 from './pages/labs/Lab4_Misconfig';
import Lab5 from './pages/labs/Lab5_IDOR';
import Lab6 from './pages/labs/Lab6_Crypto';
import LabReport from './pages/LabReport';

// Playground Pages
import PlaygroundHome from './pages/playground/PlaygroundHome';
import ProductDetails from './pages/playground/ProductDetails';
import PlaygroundCart from './pages/playground/PlaygroundCart';
import PlaygroundLogin from './pages/playground/PlaygroundLogin';
import PlaygroundProfile from './pages/playground/PlaygroundProfile';
import PlaygroundScoreboard from './pages/playground/PlaygroundScoreboard';

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
              <Route path="/simulation/lab-05" element={<Lab5 />} />
              <Route path="/simulation/lab-06" element={<Lab6 />} />
              <Route path="/lab-report/:id" element={<LabReport />} />
            </Route>

            {/* Playground — Standalone Layout (opens in new tab) */}
            <Route path="/playground" element={<PlaygroundLayout />}>
              <Route index element={<PlaygroundHome />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="cart" element={<PlaygroundCart />} />
              <Route path="login" element={<PlaygroundLogin />} />
              <Route path="profile" element={<PlaygroundProfile />} />
              <Route path="scoreboard" element={<PlaygroundScoreboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ProgressProvider>
    </AuthProvider>
  );
}
