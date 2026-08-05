import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { getServices } from '../../services/serviceService';
import PropuestaCartButton from './PropuestaCartButton';
import UserAvatarMenu from './UserAvatarMenu';
import logoBookit from '../../assets/logo-bookit-mark.png';

const AppHeader = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const isVendor = user?.role === 'vendedor' || user?.role === 'vendor' || user?.role === 'salon';

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada. ¡Hasta pronto!');
    navigate('/');
  };
  const [hasService, setHasService] = useState(false);

  // Solo presentacional: colapsa nav + acciones en un panel desplegable en mobile.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

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
    <header className="app-header" ref={headerRef}>
      <div className="app-shell app-header__inner">
        <Link to="/" className="app-brand" aria-label="BookIt - Ir al inicio" onClick={closeMenu}>
          <img src={logoBookit.src} alt="" width={32} height={32} className="app-brand__mark" />
          <span className="app-brand__text">BookIt</span>
        </Link>

        <button
          type="button"
          className={`app-header__menu-toggle${isMenuOpen ? ' is-open' : ''}`}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="app-header-panel"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className="app-header__menu-bar" />
          <span className="app-header__menu-bar" />
          <span className="app-header__menu-bar" />
        </button>

        <div id="app-header-panel" className={`app-header__panel${isMenuOpen ? ' is-open' : ''}`}>
          <nav className="app-nav" aria-label="Navegación principal">
            <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => `app-nav__link${isActive ? ' is-active' : ''}`}>
              Inicio
            </NavLink>
            <NavLink to="/lounges" onClick={closeMenu} className={({ isActive }) => `app-nav__link${isActive ? ' is-active' : ''}`}>
              Salones
            </NavLink>
            <NavLink to="/services" onClick={closeMenu} className={({ isActive }) => `app-nav__link${isActive ? ' is-active' : ''}`}>
              Servicios
            </NavLink>
            <NavLink to="/contact" onClick={closeMenu} className={({ isActive }) => `app-nav__link${isActive ? ' is-active' : ''}`}>
              Contacto
            </NavLink>
          </nav>

          <div className="app-header__actions">
            <PropuestaCartButton />
            {isAuthenticated ? (
              <>
                {isVendor && hasService && (
                  <NavLink to="/vendor/dashboard" onClick={closeMenu} className="app-button app-button--ghost">
                    Panel Dueño
                  </NavLink>
                )}
                <UserAvatarMenu user={user!} logout={handleLogout} />
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={closeMenu} className="app-button app-button--ghost">
                  Ingresar
                </NavLink>
                <NavLink to="/register/user" onClick={closeMenu} className="app-button app-button--primary">
                  Registrarse
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
