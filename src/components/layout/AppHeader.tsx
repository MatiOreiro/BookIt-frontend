import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const AppHeader = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const isVendor = user?.role === 'vendedor' || user?.role === 'vendor' || user?.role === 'salon';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

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
          <a className="app-nav__link" href="#hero-search">
            Buscar
          </a>
          <a className="app-nav__link" href="#footer">
            Contacto
          </a>
        </nav>

        <div className="app-header__actions" ref={menuRef}>
          {isAuthenticated ? (
            <>
              <div className="app-user-menu">
                <button
                  type="button"
                  className="app-user-chip app-user-chip--button"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                >
                  Hola, {user?.name || 'usuario'}
                </button>

                {isMenuOpen && (
                  <div className="app-user-menu__dropdown" role="menu">
                    <NavLink
                      to="/change-password"
                      className="app-user-menu__item"
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Cambiar contraseña
                    </NavLink>
                  </div>
                )}
              </div>
              {isVendor && (
                <NavLink to="/vendor/dashboard" className="app-button app-button--ghost">
                  Panel Dueño
                </NavLink>
              )}
              <button type="button" onClick={logout} className="app-button app-button--text">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="app-button app-button--ghost">
                Ingresar
              </NavLink>
              <NavLink to="/register" className="app-button app-button--primary">
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
