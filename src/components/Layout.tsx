import { Outlet } from 'react-router-dom';
import AppFooter from './layout/AppFooter';
import AppHeader from './layout/AppHeader';
import { ToastProvider } from '../context/ToastContext';

const Layout = () => {
  return (
    <ToastProvider>
      <div className="app-layout">
        <AppHeader />

        <main className="app-main">
          <Outlet />
        </main>

        <AppFooter />
      </div>
    </ToastProvider>
  );
};

export default Layout;
