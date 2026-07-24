# User Avatar Menu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el chip "Hola, {nombre}" del header por un botón circular con avatar que despliega un menú con Editar perfil, Cambiar contraseña, Registrar servicio, Mis trámites y Cerrar sesión.

**Architecture:** Se extrae la lógica del menú de usuario a un nuevo componente `UserAvatarMenu` que encapsula el botón avatar, el estado de apertura del dropdown y el handler de click-outside. `AppHeader` se simplifica eliminando el estado, refs y botones sueltos que pasan a vivir en el nuevo componente.

**Tech Stack:** React 18, TypeScript, React Router DOM v7, CSS vanilla (sin librerías de UI), Next.js 14 como host.

## Global Constraints

- Sin librerías externas de íconos — usar SVG inline
- Sin framework de testing — verificación manual en browser con `npm run dev`
- Respetar el sistema de variables CSS existente en `App.css` (`--primary`, `--primary-soft`, `--border`, `--text`, `--text-muted`, `--shadow`, `var(--border)`, etc.)
- El git repo del frontend está en `BookIt-frontend/` — todos los comandos git se ejecutan desde esa carpeta
- No modificar `AppRouter.tsx`, `AuthContext.tsx`, ni ningún tipo en `types/auth.ts`

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/components/layout/UserAvatarMenu.tsx` | Crear | Botón avatar + dropdown con todos los ítems del menú |
| `src/components/layout/AppHeader.tsx` | Modificar | Eliminar chip/estado/botones sueltos; usar `<UserAvatarMenu>` |
| `src/App.css` | Modificar | Nuevas clases de avatar + fix de alineación del dropdown |

---

## Task 1: Crear branch de trabajo

**Files:**
- (ninguno — solo git)

- [ ] **Step 1: Pararse en la carpeta del frontend**

```bash
cd "c:/Users/Matias oreiro/Desktop/ORT/Proyecto integrador/BookIt-frontend"
```

- [ ] **Step 2: Crear y pararse en la nueva branch**

```bash
git checkout -b feature/user-avatar-menu
```

Salida esperada: `Switched to a new branch 'feature/user-avatar-menu'`

- [ ] **Step 3: Verificar que está en la branch correcta**

```bash
git branch
```

Salida esperada: `* feature/user-avatar-menu` marcada con asterisco.

---

## Task 2: Crear componente `UserAvatarMenu`

**Files:**
- Crear: `src/components/layout/UserAvatarMenu.tsx`

**Interfaces:**
- Consume: `User` de `../../types/auth` (campos: `name: string`, `profileImageUrl?: string | null`)
- Produce: `<UserAvatarMenu user={User} logout={() => void} />` — usado en Task 3

- [ ] **Step 1: Crear el archivo con el contenido completo**

Crear `src/components/layout/UserAvatarMenu.tsx` con este contenido exacto:

```tsx
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
```

- [ ] **Step 2: Verificar que TypeScript no tiene errores**

```bash
npx tsc --noEmit
```

Salida esperada: sin output (sin errores). Si hay errores, corregirlos antes de continuar.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/UserAvatarMenu.tsx
git commit -m "feat: add UserAvatarMenu component with avatar button and dropdown"
```

---

## Task 3: Refactorizar `AppHeader`

**Files:**
- Modificar: `src/components/layout/AppHeader.tsx`

**Interfaces:**
- Consume: `UserAvatarMenu` de `./UserAvatarMenu` (producida en Task 2)
- Consume: `useAuth()` → `{ isAuthenticated, user, logout }` (sin cambios)

- [ ] **Step 1: Reemplazar el contenido completo de `AppHeader.tsx`**

Reemplazar todo el contenido de `src/components/layout/AppHeader.tsx` con:

```tsx
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
```

- [ ] **Step 2: Verificar TypeScript sin errores**

```bash
npx tsc --noEmit
```

Salida esperada: sin output.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppHeader.tsx
git commit -m "refactor: simplify AppHeader, delegate user menu to UserAvatarMenu"
```

---

## Task 4: Agregar CSS

**Files:**
- Modificar: `src/App.css`

- [ ] **Step 1: Corregir alineación del dropdown**

En `src/App.css`, localizar el bloque `.app-user-menu__dropdown` (alrededor de la línea 161) y cambiar `left: 0` por `right: 0`:

```css
/* ANTES */
.app-user-menu__dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;

/* DESPUÉS */
.app-user-menu__dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
```

- [ ] **Step 2: Agregar las nuevas clases CSS**

Agregar el siguiente bloque al final de la sección de estilos del header (después del bloque `.app-user-menu__item:hover { ... }`, antes de `.app-button { ... }`):

```css
/* Avatar button */
.app-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  background: transparent;
  transition: box-shadow 180ms ease;
}

.app-user-avatar:hover,
.app-user-avatar[aria-expanded="true"] {
  box-shadow: 0 0 0 2px var(--primary);
}

.app-user-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.app-user-avatar__fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--primary-soft);
  color: var(--primary);
}

/* Disabled menu item (Mis trámites) */
.app-user-menu__item--disabled {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 0.95rem;
  border-radius: 0.8rem;
  color: var(--text);
  font-weight: 600;
  opacity: 0.5;
  cursor: default;
  pointer-events: none;
  user-select: none;
}

.app-user-menu__item-badge {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-muted);
}

/* Danger item (Cerrar sesión) */
.app-user-menu__item--danger {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.8rem 0.95rem;
  border-radius: 0.8rem;
  border: 0;
  background: transparent;
  color: #dc2626;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.app-user-menu__item--danger:hover {
  background: rgba(220, 38, 38, 0.08);
}

/* Separator */
.app-user-menu__separator {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 0.3rem 0.45rem;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "style: add user avatar menu CSS classes"
```

---

## Task 5: Verificación manual en browser

- [ ] **Step 1: Levantar el servidor de desarrollo**

```bash
npm run dev
```

Abrir `http://localhost:3000` en el browser.

- [ ] **Step 2: Verificar estado no autenticado**

Sin iniciar sesión, el header debe mostrar los botones "Ingresar" y "Registrarse". No debe aparecer ningún avatar ni menú de usuario.

- [ ] **Step 3: Verificar avatar con foto de perfil**

Iniciar sesión con un usuario que tenga `profileImageUrl`. El header debe mostrar el círculo con la foto del usuario al extremo derecho. El chip "Hola, {nombre}" ya no debe aparecer.

- [ ] **Step 4: Verificar avatar sin foto de perfil**

Iniciar sesión con un usuario sin foto. El botón circular debe mostrar el ícono SVG de persona con fondo violeta claro.

- [ ] **Step 5: Verificar apertura y cierre del dropdown**

Hacer clic en el avatar. Debe aparecer el dropdown con los 5 ítems en orden:
1. Editar perfil
2. Cambiar contraseña
3. Registrar servicio
4. Mis trámites (deshabilitado, con "(próximamente)")
5. — separador —
6. Cerrar sesión (texto rojo)

Hacer clic fuera del menú. El dropdown debe cerrarse.

- [ ] **Step 6: Verificar navegación desde el dropdown**

- Hacer clic en "Editar perfil" → navega a `/profile`, menú se cierra
- Hacer clic en "Cambiar contraseña" → navega a `/change-password`, menú se cierra
- Hacer clic en "Registrar servicio" → navega a `/services/register`, menú se cierra
- Hacer clic en "Mis trámites" → no debe ocurrir nada (pointer-events: none)

- [ ] **Step 7: Verificar cierre de sesión**

Hacer clic en "Cerrar sesión". La sesión debe cerrarse y el usuario debe ver los botones "Ingresar" / "Registrarse".

- [ ] **Step 8: Verificar alineación del dropdown**

El dropdown debe abrirse alineado al borde derecho del avatar, sin salirse de la pantalla.

- [ ] **Step 9: Verificar vendor con Panel Dueño**

Iniciar sesión con un usuario vendedor que tenga servicio registrado. El header debe mostrar el botón "Panel Dueño" a la izquierda del avatar.

- [ ] **Step 10: Commit final del plan y spec**

```bash
git add docs/
git commit -m "docs: add user avatar menu design spec and implementation plan"
```
