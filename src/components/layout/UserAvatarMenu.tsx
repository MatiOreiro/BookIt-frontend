import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { User } from '../../types/auth';

interface UserAvatarMenuProps {
  user: User;
  logout: () => void;
}

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const UserAvatarMenu = ({ user, logout }: UserAvatarMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const close = () => setIsOpen(false);

  return (
    <div className="app-user-menu" ref={menuRef}>
      <button
        type="button"
        className="app-user-avatar"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menú de usuario"
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={user.name}
            className="app-user-avatar__img"
          />
        ) : (
          <span className="app-user-avatar__fallback" aria-hidden="true">
            <PersonIcon />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="app-user-menu__dropdown" role="menu">
          <NavLink
            to="/profile"
            className="app-user-menu__item"
            role="menuitem"
            onClick={close}
          >
            Editar perfil
          </NavLink>
          <NavLink
            to="/change-password"
            className="app-user-menu__item"
            role="menuitem"
            onClick={close}
          >
            Cambiar contraseña
          </NavLink>
          <NavLink
            to="/services/register"
            className="app-user-menu__item"
            role="menuitem"
            onClick={close}
          >
            Registrar servicio
          </NavLink>
          <span className="app-user-menu__item--disabled" aria-disabled="true">
            Mis trámites
            <span className="app-user-menu__item-badge">(próximamente)</span>
          </span>
          <hr className="app-user-menu__separator" />
          <button
            type="button"
            className="app-user-menu__item--danger"
            role="menuitem"
            onClick={() => {
              logout();
              close();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAvatarMenu;
