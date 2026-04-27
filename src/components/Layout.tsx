import { Outlet } from 'react-router-dom';
import AppFooter from './layout/AppFooter';
import AppHeader from './layout/AppHeader';

const Layout = () => {
  return (
    <div className="app-layout">
      <AppHeader />

      <main className="app-main">
        <Outlet />
      </main>

      <AppFooter />
    </div>
  );
};

export default Layout;
