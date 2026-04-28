import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterChoicePage from '../pages/RegisterChoicePage';
import RegisterUserPage from '../pages/RegisterUserPage';
import RegisterServicePage from '../pages/RegisterServicePage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import VendorDashboardPage from '../pages/VendorDashboardPage';
import HomePage from '../pages/HomePage';
import { setNavigate } from '../utils/navigation';

const NavigationRegistrar = () => {
  const nav = useNavigate();
  useEffect(() => {
    setNavigate(nav);
  }, [nav]);
  return null;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <NavigationRegistrar />
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterChoicePage />} />
          <Route path="/register/user" element={<RegisterUserPage />} />
          <Route path="/register/service" element={<RegisterServicePage />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/services/register"
            element={
              <ProtectedRoute>
                <RegisterServicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['vendedor', 'vendor', 'salon']}>
                <VendorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
