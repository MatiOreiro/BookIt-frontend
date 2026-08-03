# Página de Contacto — Design Spec

**Date:** 2026-08-03
**Status:** Approved

---

## Objetivo

El link "Contacto" del header actualmente hace `href="#footer"` y solo scrollea al footer, que tiene datos de contacto genéricos de BookIt. Se reemplaza por una página dedicada `/contact` que presenta a los dos developers que crearon la aplicación (nombre, rol, email, GitHub, LinkedIn) junto con el contacto genérico de BookIt.

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/pages/ContactPage.tsx` | Nuevo componente de página |
| `src/routes/AppRouter.tsx` | Nueva ruta `/contact` dentro del `<Layout />` |
| `src/components/layout/AppHeader.tsx` | El link "Contacto" pasa de `<a href="#footer">` a `<NavLink to="/contact">` |
| `src/App.css` | Nuevas clases CSS para la página y las tarjetas de developer |

---

## Datos de los developers (hardcodeados en el componente)

```ts
const developers = [
  {
    name: 'Matias Oreiro',
    role: 'Co-creador / Desarrollador',
    email: 'matiasdoreiro@gmail.com',
    github: 'https://github.com/MatiOreiro',
    linkedin: 'https://www.linkedin.com/in/matiasoreiro/',
  },
  {
    name: 'Matias Pietrafesa',
    role: 'Co-creador / Desarrollador',
    email: 'matiaspietrafesa1@gmail.com',
    github: 'https://github.com/matiaspietrafesa',
    linkedin: 'https://www.linkedin.com/in/matias-pietrafesa-47084b321/',
  },
];
```

No se agrega un archivo de datos separado ni un servicio — es contenido estático propio de esta página, sin necesidad de reutilización en otro lugar.

---

## Componente `ContactPage`

**Ubicación:** `src/pages/ContactPage.tsx`

Página sin estado ni efectos — puramente presentacional. Estructura:

```
<div className="contact-page">
  <section className="contact-page__header">
    <h1>Contacto</h1>
    <p>subtítulo</p>
  </section>

  <section className="contact-page__general">
    {/* mail/teléfono genérico de BookIt, mismo dato que el footer */}
  </section>

  <section className="contact-page__team">
    <h2>Conocé al equipo</h2>
    <div className="contact-page__team-grid">
      {developers.map((dev) => <DevCard key={dev.email} {...dev} />)}
    </div>
  </section>
</div>
```

`DevCard` se define como subcomponente interno en el mismo archivo (no necesita reutilizarse en otro lado):

- Nombre (`<h3>`)
- Rol (`<p className="dev-card__role">`)
- Lista de links: email (`mailto:`), GitHub, LinkedIn — cada uno como `<a>` con `target="_blank" rel="noreferrer"` para GitHub/LinkedIn (el `mailto:` no lleva `target`).

---

## Cambios en `AppRouter`

Se agrega, junto a las demás rutas públicas dentro de `<Route element={<Layout />}>`:

```tsx
<Route path="/contact" element={<ContactPage />} />
```

Ubicada junto a `/services`, sin protección de auth (pública, igual que Inicio/Salones/Servicios).

---

## Cambios en `AppHeader`

Reemplazar:

```tsx
<a className="app-nav__link" href="#footer">
  Contacto
</a>
```

por:

```tsx
<NavLink to="/contact" className={({ isActive }) => `app-nav__link${isActive ? ' is-active' : ''}`}>
  Contacto
</NavLink>
```

Mismo patrón que los demás `NavLink` del nav (Inicio, Salones, Servicios).

---

## Sin cambios

- `AppFooter.tsx` no se modifica — sigue mostrando su propio bloque de contacto genérico, independiente de esta página.
- No hay formulario de contacto ni envío de datos a backend; la página es puramente informativa.

---

## CSS — Clases nuevas

Siguiendo la convención BEM-like existente y los tokens de `:root` (`--primary`, `--surface`, `--border`, `--shadow-soft`, `--text-muted`), en el estilo de `.services-page` / `.search-card`:

```css
.contact-page {
  padding: 2rem 1rem 4rem;
  max-width: 1180px;
  margin: 0 auto;
}

.contact-page__header {
  margin-bottom: 2rem;
  text-align: center;
}

.contact-page__header h1 {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.contact-page__header p {
  color: var(--text-muted);
}

.contact-page__general {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.25rem 1.5rem;
  margin: 0 auto 3rem;
  max-width: 640px;
  border-radius: 1.2rem;
  background: var(--surface-strong);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
  text-align: center;
}

.contact-page__team h2 {
  text-align: center;
  margin-bottom: 1.5rem;
}

.contact-page__team-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

@media (max-width: 720px) {
  .contact-page__team-grid {
    grid-template-columns: 1fr;
  }
}

.dev-card {
  padding: 1.75rem;
  border-radius: 1.4rem;
  background: var(--surface-strong);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
  text-align: center;
}

.dev-card h3 {
  margin: 0 0 0.3rem;
  font-size: 1.25rem;
}

.dev-card__role {
  color: var(--text-muted);
  margin: 0 0 1.1rem;
  font-size: 0.9rem;
}

.dev-card__links {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  align-items: center;
}

.dev-card__links a {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}

.dev-card__links a:hover {
  text-decoration: underline;
}
```

---

## Notas de implementación

- No se usan íconos ni librerías nuevas — solo texto para los links (ej. "Email", "GitHub", "LinkedIn").
- La página es estática: no hay `useEffect`, `useState` ni llamadas a servicios.
- El orden de las tarjetas es el orden del array `developers` (Matias Oreiro primero, Matias Pietrafesa segundo).
