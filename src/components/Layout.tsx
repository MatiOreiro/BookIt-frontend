import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import AppFooter from './layout/AppFooter';
import AppHeader from './layout/AppHeader';
import PropuestaDrawer from './layout/PropuestaDrawer';

const Layout = () => {
  return (
    <div className="app-layout">
      <AppHeader />

      <main className="app-main">
        <Outlet />
      </main>

      <AppFooter />

      <PropuestaDrawer />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </div>
  );
};

export default Layout;
