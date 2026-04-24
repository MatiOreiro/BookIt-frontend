import { Link, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Layout = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="layout-header">
        <nav className="layout-nav">
          <Link to="/" className="layout-logo">
            BookIt
          </Link>
          <div className="layout-nav-links">
            {isAuthenticated ? (
              <>
                <span className="layout-user">Hola, {user?.name}</span>
                <Link to="/services/register">Registrar Servicio</Link>
                <button onClick={logout} className="btn-logout">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Iniciar sesión</Link>
                <Link to="/register">Registrarse</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
