# Página de Contacto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el link "Contacto" del header (que actualmente hace scroll al footer) por una página dedicada `/contact` que presenta a los dos developers de BookIt y el contacto genérico de la empresa.

**Architecture:** Página estática de React (sin estado, sin efectos, sin llamadas a servicios) montada como nueva ruta pública en el router existente. Reutiliza los design tokens y convenciones BEM-like ya definidos en `src/App.css`.

**Tech Stack:** React 18 + TypeScript, react-router-dom v7, CSS plano en `src/App.css` (sin CSS modules ni styled-components en este proyecto).

## Global Constraints

- No hay test runner configurado en este proyecto (no jest/vitest). La verificación de cada task se hace con `npx tsc --noEmit`, `npm run lint`, y prueba manual en el navegador (`npm run dev`).
- Seguir la convención BEM-like existente para clases CSS (ej. `.contact-page__header`, `.dev-card__role`).
- No agregar librerías nuevas (sin íconos, sin form libraries).
- Los datos de los developers van hardcodeados dentro de `ContactPage.tsx`, no en un archivo de datos separado ni en un servicio.
- Spec de referencia: `docs/superpowers/specs/2026-08-03-pagina-contacto-design.md`.

---

### Task 1: Crear `ContactPage` y agregar la ruta `/contact`

**Files:**
- Create: `src/pages/ContactPage.tsx`
- Modify: `src/routes/AppRouter.tsx:16` (agregar import), `src/routes/AppRouter.tsx:527` (agregar `<Route>` después de la ruta `/services`)

**Interfaces:**
- Produces: `ContactPage` — componente default export, sin props, renderiza `<div className="contact-page">`.

- [ ] **Step 1: Crear el componente `ContactPage`**

```tsx
// src/pages/ContactPage.tsx
type Developer = {
  name: string;
  role: string;
  email: string;
  github: string;
  linkedin: string;
};

const developers: Developer[] = [
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

const DevCard = ({ name, role, email, github, linkedin }: Developer) => (
  <article className="dev-card">
    <h3>{name}</h3>
    <p className="dev-card__role">{role}</p>
    <div className="dev-card__links">
      <a href={`mailto:${email}`}>{email}</a>
      <a href={github} target="_blank" rel="noreferrer">
        GitHub
      </a>
      <a href={linkedin} target="_blank" rel="noreferrer">
        LinkedIn
      </a>
    </div>
  </article>
);

const ContactPage = () => {
  return (
    <div className="contact-page">
      <section className="contact-page__header">
        <h1>Contacto</h1>
        <p>¿Tenés dudas o sugerencias? Escribinos o conocé al equipo que construyó BookIt.</p>
      </section>

      <section className="contact-page__general">
        <a href="mailto:hola@bookit.com">hola@bookit.com</a>
        <a href="tel:+5491123456789">+54 9 11 2345-6789</a>
        <span>Atención 24/7</span>
      </section>

      <section className="contact-page__team">
        <h2>Conocé al equipo</h2>
        <div className="contact-page__team-grid">
          {developers.map((dev) => (
            <DevCard key={dev.email} {...dev} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
```

- [ ] **Step 2: Registrar la ruta en `AppRouter`**

En `src/routes/AppRouter.tsx`, agregar el import junto a los demás imports de páginas (línea 16, después de `MisTramitesPage`):

```tsx
import ContactPage from '../pages/ContactPage';
```

Y agregar la ruta pública, junto a la de `/services` (dentro de `<Route element={<Layout />}>`, sin `ProtectedRoute`):

```tsx
<Route path="/contact" element={<ContactPage />} />
```

- [ ] **Step 3: Verificar tipos y lint**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos relacionados a `ContactPage.tsx` ni `AppRouter.tsx`.

Run: `npm run lint`
Expected: sin errores nuevos.

- [ ] **Step 4: Verificar manualmente en el navegador**

Run: `npm run dev`, navegar a `http://localhost:3000/contact` (o el puerto que indique la consola).
Expected: se ve la página con el título "Contacto", el bloque de contacto genérico y las dos tarjetas de developers (sin estilos todavía, eso es el Task 3).

- [ ] **Step 5: Commit**

```bash
git add src/pages/ContactPage.tsx src/routes/AppRouter.tsx
git commit -m "feat: agregar pagina de contacto con presentacion del equipo"
```

---

### Task 2: Apuntar el link "Contacto" del header a `/contact`

**Files:**
- Modify: `src/components/layout/AppHeader.tsx:61-63`

**Interfaces:**
- Consumes: ruta `/contact` producida en Task 1.

- [ ] **Step 1: Reemplazar el `<a href="#footer">` por un `NavLink`**

En `src/components/layout/AppHeader.tsx`, reemplazar:

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

(El import de `NavLink` ya existe en la línea 2 de este archivo, no hace falta agregarlo.)

- [ ] **Step 2: Verificar tipos y lint**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

Run: `npm run lint`
Expected: sin errores nuevos.

- [ ] **Step 3: Verificar manualmente en el navegador**

Con `npm run dev` corriendo, hacer clic en "Contacto" en el header desde cualquier página.
Expected: navega a `/contact` (no hace scroll al footer) y el link "Contacto" queda resaltado como activo (mismo estilo que "Inicio"/"Salones"/"Servicios" cuando están activos).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppHeader.tsx
git commit -m "feat: apuntar el link Contacto del header a la pagina /contact"
```

---

### Task 3: Estilos de la página de contacto

**Files:**
- Modify: `src/App.css` (agregar al final del archivo)

**Interfaces:**
- Consumes: clases `contact-page`, `contact-page__header`, `contact-page__general`, `contact-page__team`, `contact-page__team-grid`, `dev-card`, `dev-card__role`, `dev-card__links` usadas en `ContactPage.tsx` (Task 1).

- [ ] **Step 1: Agregar las clases CSS al final de `src/App.css`**

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

- [ ] **Step 2: Verificar manualmente en el navegador**

Con `npm run dev` corriendo, ir a `/contact` en desktop (>720px) y en un viewport angosto (<720px, usar devtools responsive mode).
Expected: en desktop las dos tarjetas de developers se ven lado a lado; en mobile se apilan en una columna. El bloque de contacto genérico y las tarjetas usan el estilo de superficie/sombra consistente con el resto del sitio (mismo look que `.search-card` / tarjetas de `.services-page`).

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "style: agregar estilos de la pagina de contacto"
```

---

## Self-Review Notes

- **Cobertura del spec:** ruta `/contact` (Task 1), reemplazo del link del header (Task 2), tarjetas de developers con los 5 datos requeridos (Task 1), bloque de contacto genérico de BookIt (Task 1), estilos siguiendo convenciones existentes (Task 3). Footer sin cambios — confirmado, ninguna task lo toca.
- **Sin placeholders:** todos los steps tienen código completo y literal (nombres, emails, URLs reales de los dos developers).
- **Consistencia de tipos:** `Developer` se define y se consume únicamente dentro de `ContactPage.tsx` (Task 1); no se referencia desde otras tasks, por lo que no hay riesgo de desalineación de firmas entre tasks.
