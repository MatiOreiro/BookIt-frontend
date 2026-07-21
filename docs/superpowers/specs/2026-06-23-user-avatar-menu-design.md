# User Avatar Menu — Design Spec

**Date:** 2026-06-23
**Status:** Approved

---

## Objetivo

Reemplazar el chip de texto "Hola, {nombre}" del header por un botón circular con la foto de perfil del usuario. Al hacer clic se despliega un menú con las opciones: Editar perfil, Cambiar contraseña, Registrar servicio, Mis trámites (próximamente) y Cerrar sesión. El menú solo se muestra cuando el usuario está autenticado y se posiciona al extremo derecho del header.

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/layout/UserAvatarMenu.tsx` | Nuevo componente |
| `src/components/layout/AppHeader.tsx` | Simplificación — remueve chip, Registrar Servicio y Cerrar Sesión; agrega `<UserAvatarMenu>` |
| `src/App.css` | Nuevas clases CSS para avatar y ajustes al dropdown |

---

## Componente `UserAvatarMenu`

**Ubicación:** `src/components/layout/UserAvatarMenu.tsx`

### Props

```ts
interface UserAvatarMenuProps {
  user: User;
  logout: () => void;
}
```

### Estado interno

- `isOpen: boolean` — controla visibilidad del dropdown
- `menuRef: RefObject<HTMLDivElement>` — para el click-outside handler

### Comportamiento

- El `click-outside` handler se registra con `mousedown` en `document` al montar y se limpia al desmontar.
- Al hacer clic en cualquier ítem del dropdown que navegue, se cierra el menú (`setIsOpen(false)`).
- `logout()` se llama directamente al hacer clic en "Cerrar sesión".

### Botón trigger (avatar)

- Círculo de 40×40px, `border-radius: 50%`, sin borde nativo (`border: 0`).
- Si `user.profileImageUrl` es truthy: renderiza `<img>` con la URL, `object-fit: cover`, `border-radius: 50%`.
- Si `user.profileImageUrl` es falsy: renderiza un SVG inline de silueta de persona con fondo `var(--primary-soft)` y color `var(--primary)`.
- Atributos de accesibilidad: `aria-haspopup="menu"`, `aria-expanded={isOpen}`, `aria-label="Menú de usuario"`.

### Ítems del dropdown

Los ítems se renderizan en este orden:

1. **Editar perfil** — `<NavLink to="/profile">`, cierra menú al hacer clic
2. **Cambiar contraseña** — `<NavLink to="/change-password">`, cierra menú al hacer clic
3. **Registrar servicio** — `<NavLink to="/services/register">`, cierra menú al hacer clic
4. **Mis trámites** — elemento `<span>` deshabilitado (no es un link), con texto secundario "(próximamente)", clase `app-user-menu__item--disabled`, sin hover, sin cursor pointer
5. Separador `<hr>` con clase `app-user-menu__separator`
6. **Cerrar sesión** — `<button>`, llama a `logout()`, clase `app-user-menu__item--danger` (color rojo)

---

## Cambios en `AppHeader`

### Se elimina

- El bloque `<div className="app-user-menu">` completo (chip + dropdown actuales)
- El `<NavLink to="/services/register">` suelto
- El `<button onClick={logout}>Cerrar sesión</button>` suelto
- El `menuRef` y el `useEffect` del click-outside (ahora viven en `UserAvatarMenu`)
- El estado `isMenuOpen`

### Se agrega

```tsx
<UserAvatarMenu user={user!} logout={logout} />
```

Al final del bloque `<div className="app-header__actions">`, después del botón "Panel Dueño".

### Orden final de acciones (usuario autenticado)

```
[Panel Dueño (condicional)]   [Avatar ▼]
```

### Sin cambios

- El botón "Panel Dueño" (visible solo para vendors con servicio registrado)
- Los botones "Ingresar" y "Registrarse" para usuarios no autenticados

---

## CSS — Clases nuevas y modificadas

### Nuevas clases

```css
/* Botón circular del trigger */
.app-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  transition: box-shadow 180ms ease;
}

.app-user-avatar:hover,
.app-user-avatar[aria-expanded="true"] {
  box-shadow: 0 0 0 2px var(--primary);
}

/* Foto de perfil dentro del avatar */
.app-user-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

/* Fallback SVG cuando no hay foto */
.app-user-avatar__fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--primary-soft);
  color: var(--primary);
}

/* Ítem deshabilitado (Mis trámites) */
.app-user-menu__item--disabled {
  opacity: 0.5;
  cursor: default;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 0.95rem;
  border-radius: 0.8rem;
  color: var(--text);
  font-weight: 600;
}

/* Texto "(próximamente)" dentro del ítem deshabilitado */
.app-user-menu__item-badge {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-muted);
}

/* Ítem de cierre de sesión */
.app-user-menu__item--danger {
  color: #dc2626;
  background: transparent;
  border: 0;
  width: 100%;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.8rem 0.95rem;
  border-radius: 0.8rem;
  font-weight: 600;
}

.app-user-menu__item--danger:hover {
  background: rgba(220, 38, 38, 0.08);
}

/* Separador */
.app-user-menu__separator {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 0.3rem 0.45rem;
}
```

### Clases modificadas

- `.app-user-menu__dropdown`: cambiar `left: 0` → `right: 0` para alineación correcta cuando el avatar está al extremo derecho.

---

## Notas de implementación

- El SVG del fallback puede ser un path simple de silueta de persona (estilo monoline). No se usa ninguna librería de íconos.
- El cierre del menú al navegar se logra pasando `onClick={() => setIsOpen(false)}` a cada `NavLink`.
- No se necesitan cambios en `AuthContext`, `useAuth`, ni en el tipo `User` — `profileImageUrl` ya existe.
- La ruta `/profile` ya existe en el router y tiene su página (`ProfilePage.tsx`).
- "Mis trámites" no tiene ruta por ahora; su ítem es un elemento no interactivo con `pointer-events: none`.
