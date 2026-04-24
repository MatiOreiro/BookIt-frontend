import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterUserPage from '../pages/RegisterUserPage';
import RegisterServicePage from '../pages/RegisterServicePage';
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
          <Route path="/register" element={<RegisterUserPage />} />

          {/* Protected routes */}
          <Route
            path="/services/register"
            element={
              <ProtectedRoute>
                <RegisterServicePage />
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
