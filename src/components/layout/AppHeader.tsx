import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getServices } from '../../services/serviceService';
import UserAvatarMenu from './UserAvatarMenu';

const AppHeader = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const isVendor = user?.role === 'vendedor' || user?.role === 'vendor' || user?.role === 'salon';
  const [hasService, setHasService] = useState(false);

  useEffect(() => {
    const loadVendorServices = async () => {
      if (!isAuthenticated || !isVendor || !user?.id) {
        setHasService(false);
        return;
      }
      try {
        const services = await getServices();
        setHasService(
          services.some(
            (service) => service.vendorId === user.id || service.vendor?.id === user.id,
          ),
        );
      } catch (error) {
        console.error('Error verificando servicios del vendedor', error);
        setHasService(false);
      }
    };

    loadVendorServices();
  }, [isAuthenticated, isVendor, user?.id]);

  return (
    <header className="app-header">
      <div className="app-shell app-header__inner">
        <Link to="/" className="app-brand" aria-label="BookIt - Ir al inicio">
          <span className="app-brand__mark">✦</span>
          <span className="app-brand__text">BookIt</span>
        </Link>

        <nav className="app-nav" aria-label="Navegación principal">
          <NavLink to="/" end className={({ isActive }) => `app-nav__link${isActive ? ' is-active' : ''}`}>
            Inicio
          </NavLink>
          <NavLink to="/lounges" className={({ isActive }) => `app-nav__link${isActive ? ' is-active' : ''}`}>
            Salones
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => `app-nav__link${isActive ? ' is-active' : ''}`}>
            Servicios
          </NavLink>
          <a className="app-nav__link" href="#footer">
            Contacto
          </a>
        </nav>

        <div className="app-header__actions">
          {isAuthenticated ? (
            <>
              {isVendor && hasService && (
                <NavLink to="/vendor/dashboard" className="app-button app-button--ghost">
                  Panel Dueño
                </NavLink>
              )}
              <UserAvatarMenu user={user!} logout={logout} />
            </>
          ) : (
            <>
              <NavLink to="/login" className="app-button app-button--ghost">
                Ingresar
              </NavLink>
              <NavLink to="/register/user" className="app-button app-button--primary">
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
