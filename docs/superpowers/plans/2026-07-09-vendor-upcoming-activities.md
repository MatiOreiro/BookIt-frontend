# Vendor Dashboard Upcoming Activities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar una sección "Próximas actividades" en el panel de dueño (`VendorDashboardPage.tsx`), entre las métricas y los servicios asociados, que muestra reservas y visitas pendientes de pago/confirmación o próximas (7 días) de **todos** los servicios del dueño, con el mismo estilo visual que la vista de lista de `ServiceOwnerDashboardPage.tsx`.

**Architecture:** Todo el trabajo vive en `VendorDashboardPage.tsx`, que ya carga `services` (con `visitas`/`reservas` anidadas) vía `getServices()`. Se agrega lógica local (helpers de fecha, cálculo de saldo pendiente, filtro combinado, memoización) y dos componentes de tarjeta de solo lectura (`UpcomingVisitCard`, `UpcomingReservationCard`) calcados de los estilos ya existentes en `service-owner-dashboard__*`. No hay fetches nuevos, no hay acciones inline: al clickear una tarjeta se navega a `/vendor/services/{serviceId}` (mismo patrón que "Ver detalle dueño").

**Tech Stack:** Next.js 14, React 18, TypeScript, CSS en `src/App.css`

## Global Constraints

- Ventana de "próximos días" = 7 días desde `Date.now()` (`now` a `now + 7*24*60*60*1000`)
- Visita "pendiente" = `estado.toLowerCase() === 'pendiente'` (incluye vencidas, sin importar fecha)
- Reserva "pendiente de pago" = `!confirmada` **O** (`confirmada` y saldo pendiente `> 0`, saldo = `montoAcordado - sum(pagos.importe)`)
- Un ítem se incluye si cumple su condición de "pendiente" **O** su fecha cae en la ventana de 7 días
- Tabs: Ambas (default) / Reservas / Visitas — ordenadas por fecha ascendente
- Sin botones de acción inline; click en tarjeta navega a `/vendor/services/{serviceId}` con `{ state: { service } }`
- Sin nuevos endpoints ni cambios de backend
- No se modifica `ServiceOwnerDashboardPage.tsx`
- Spec completo en `BookIt-frontend/docs/superpowers/specs/2026-07-09-vendor-upcoming-activities-design.md`

---

## File Map

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Modificar | `BookIt-frontend/src/pages/VendorDashboardPage.tsx` | Helpers de fecha/saldo, filtro combinado memoizado, tarjetas de solo lectura, sección "Próximas actividades" |
| Modificar | `BookIt-frontend/src/App.css` | Estilos de la nueva sección y su contenedor con scroll interno |

---

## Task 1: Agregar lógica, tarjetas y sección "Próximas actividades" en `VendorDashboardPage.tsx`

**Files:**
- Modificar: `BookIt-frontend/src/pages/VendorDashboardPage.tsx` (reemplazo completo del archivo)

**Interfaces:**
- Consume: `Service`, `ReservationDto`, `VisitDto` de `../types/service` (ya importados)
- Consume: `useNavigate` de `react-router-dom` (ya importado)
- Produce (local, no exportado): `UpcomingTab = 'ambas' | 'reservas' | 'visitas'`, componentes `UpcomingVisitCard`, `UpcomingReservationCard`

- [ ] **Step 1: Reemplazar el contenido completo de `VendorDashboardPage.tsx`**

Reemplazar el archivo completo con:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { deleteService, getServices } from '../services/serviceService';
import type { ReservationDto, Service, VisitDto } from '../types/service';

const currencyFormatter = new Intl.NumberFormat('es-UY');
const dateFormatter = new Intl.DateTimeFormat('es-UY', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('es-UY', {
  hour: '2-digit',
  minute: '2-digit',
});

const UPCOMING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type UpcomingTab = 'ambas' | 'reservas' | 'visitas';

type UpcomingItem =
  | { kind: 'visita'; date: Date | null; visit: VisitDto; service: Service }
  | { kind: 'reserva'; date: Date | null; reservation: ReservationDto; service: Service };

const parseUpcomingDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isWithinUpcomingWindow = (date: Date | null, now: number) =>
  date !== null && date.getTime() >= now && date.getTime() <= now + UPCOMING_WINDOW_MS;

const getSaldoPendiente = (reservation: ReservationDto) => {
  const monto = reservation.montoAcordado ?? 0;
  const pagado = (reservation.pagos ?? []).reduce((sum, pago) => sum + pago.importe, 0);
  return monto - pagado;
};

interface UpcomingVisitCardProps {
  visit: VisitDto;
  service: Service;
  onNavigate: () => void;
}

const UpcomingVisitCard = ({ visit, service, onNavigate }: UpcomingVisitCardProps) => {
  const visitDate = parseUpcomingDate(visit.fechaHoraSolicitada);
  const isPending = visit.estado.toLowerCase() === 'pendiente';

  return (
    <article
      className="service-owner-dashboard__reservation-card service-owner-dashboard__reservation-card--list vendor-dashboard__upcoming-card"
      role="button"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onNavigate();
        }
      }}
    >
      <div className="service-owner-dashboard__reservation-card-main">
        <div className="service-owner-dashboard__reservation-headline">
          <h3>{visit.userNombre || 'Cliente sin nombre'}</h3>
          <span className={isPending ? 'booking-badge is-prebooking' : 'booking-badge is-confirmed'}>
            {visit.estado || 'Pendiente'}
          </span>
        </div>

        <div className="service-owner-dashboard__reservation-meta">
          <span>🕒 {visitDate ? timeFormatter.format(visitDate) : '--:--'}</span>
          <span>📅 {visitDate ? dateFormatter.format(visitDate) : 'Fecha no disponible'}</span>
        </div>

        <div className="service-owner-dashboard__reservation-contact">
          <span>📝 {visit.mensaje || 'Sin mensaje'}</span>
          <span>🏷 {service.nombre}</span>
        </div>
      </div>
    </article>
  );
};

interface UpcomingReservationCardProps {
  reservation: ReservationDto;
  service: Service;
  onNavigate: () => void;
}

const UpcomingReservationCard = ({ reservation, service, onNavigate }: UpcomingReservationCardProps) => {
  const reservationDate = parseUpcomingDate(reservation.fechaReservaCliente);

  return (
    <article
      className="service-owner-dashboard__reservation-card service-owner-dashboard__reservation-card--list vendor-dashboard__upcoming-card"
      role="button"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onNavigate();
        }
      }}
    >
      <div className="service-owner-dashboard__reservation-card-main">
        <div className="service-owner-dashboard__reservation-headline">
          <h3>{reservation.usuario?.nombre || 'Cliente sin nombre'}</h3>
          <span className={reservation.confirmada ? 'booking-badge is-confirmed' : 'booking-badge is-prebooking'}>
            {reservation.confirmada ? 'Confirmada' : 'Pendiente'}
          </span>
        </div>

        <div className="service-owner-dashboard__reservation-meta">
          <span>🕒 {reservationDate ? timeFormatter.format(reservationDate) : '--:--'}</span>
          <span>📅 {reservationDate ? dateFormatter.format(reservationDate) : 'Fecha no disponible'}</span>
        </div>

        <div className="service-owner-dashboard__reservation-contact">
          <span>✉️ {reservation.usuario?.email || 'Sin email'}</span>
          <span>📞 {reservation.usuario?.telefono || 'Sin teléfono'}</span>
          <span>🏷 {service.nombre}</span>
        </div>
      </div>
    </article>
  );
};

const VendorDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingTab, setUpcomingTab] = useState<UpcomingTab>('ambas');

  useEffect(() => {
    const loadServices = async () => {
      if (!user?.id) {
        setServices([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const allServices = await getServices();
        const ownerServices = allServices.filter(
          (service) => service.vendorId === user.id || service.vendor?.id === user.id,
        );

        setServices(ownerServices);
      } catch {
        setServices([]);
        setError('No se pudieron cargar tus servicios.');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [user?.id]);

  const metrics = useMemo(() => {
    const ownerVisits: VisitDto[] = services.flatMap((service) => service.visitas ?? []);
    const ownerReservations: ReservationDto[] = services.flatMap((service) => service.reservas ?? []);
    const pendingVisits = ownerVisits.filter((visit) => visit.estado.toLowerCase() === 'pendiente');
    const confirmedReservations = ownerReservations.filter((reservation) => reservation.confirmada);

    const income = services
      .flatMap((service) => service.reservas ?? [])
      .flatMap((reservation) => reservation.pagos ?? [])
      .reduce((total, pago) => total + pago.importe, 0);

    const potentialIncome = services
      .flatMap((service) => service.reservas ?? [])
      .reduce((total, reservation) => total + (reservation.montoAcordado ?? 0), 0);

    return [
      { label: 'Visitas pendientes', value: String(pendingVisits.length), tone: 'is-warning', icon: '▣' },
      { label: 'Pre-reservas', value: String(ownerReservations.length), tone: 'is-warning', icon: '▣' },
      { label: 'Reservas confirmadas', value: String(confirmedReservations.length), tone: 'is-success', icon: '▣' },
      { label: 'Ingresos registrados', value: `$ ${currencyFormatter.format(income)}`, tone: 'is-info', icon: '$' },
      { label: 'Ingresos potenciales', value: `$ ${currencyFormatter.format(potentialIncome)}`, tone: 'is-purple', icon: '⇢' },
    ];
  }, [services]);

  const upcomingItems = useMemo(() => {
    const now = Date.now();
    const items: UpcomingItem[] = [];

    services.forEach((service) => {
      (service.visitas ?? []).forEach((visit) => {
        const date = parseUpcomingDate(visit.fechaHoraSolicitada);
        const isPending = visit.estado.toLowerCase() === 'pendiente';

        if (isPending || isWithinUpcomingWindow(date, now)) {
          items.push({ kind: 'visita', date, visit, service });
        }
      });

      (service.reservas ?? []).forEach((reservation) => {
        const date = parseUpcomingDate(reservation.fechaReservaCliente);
        const isPendingPayment = !reservation.confirmada || getSaldoPendiente(reservation) > 0;

        if (isPendingPayment || isWithinUpcomingWindow(date, now)) {
          items.push({ kind: 'reserva', date, reservation, service });
        }
      });
    });

    return items.sort((left, right) => (left.date?.getTime() ?? 0) - (right.date?.getTime() ?? 0));
  }, [services]);

  const visibleUpcomingItems = useMemo(() => {
    if (upcomingTab === 'ambas') {
      return upcomingItems;
    }

    const kind = upcomingTab === 'reservas' ? 'reserva' : 'visita';
    return upcomingItems.filter((item) => item.kind === kind);
  }, [upcomingItems, upcomingTab]);

  const servicePluralSuffix = services.length === 1 ? '' : 's';
  const serviceCountLabel = loading
    ? 'Cargando los servicios vinculados a este usuario...'
    : `${services.length} servicio${servicePluralSuffix} administrable${servicePluralSuffix}`;

  const handleDeleteService = async (serviceId: string) => {
    const confirmed = globalThis.confirm('¿Querés eliminar este servicio?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteService(serviceId);
      setServices((currentServices) => currentServices.filter((service) => service.id !== serviceId));
    } catch (deleteError) {
      console.error('Error eliminando servicio', deleteError);
      setError('No se pudo eliminar el servicio.');
    }
  };

  const goToServiceDashboard = (service: Service) => {
    navigate(`/vendor/services/${service.id}`, { state: { service } });
  };

  return (
    <div className="vendor-dashboard">
      <section className="vendor-dashboard__hero">
        <div className="app-shell vendor-dashboard__shell">
          <div className="vendor-dashboard__hero-copy">
            <p className="vendor-dashboard__eyebrow">Panel de dueño</p>
            <h1>Panel de control - {user?.name || 'Tu cuenta'}</h1>
            <p className="vendor-dashboard__subtitle">
              Un resumen general de todos tus servicios, con sus métricas y accesos rápidos para gestionarlos desde un solo lugar.
            </p>
          </div>

          <button
            type="button"
            className="vendor-dashboard__create-button"
            onClick={() => navigate('/services/register')}
          >
            Crear nuevo servicio
          </button>

          <div className="vendor-metrics">
            {metrics.map((metric) => (
              <article key={metric.label} className="vendor-metric-card">
                <span className={`vendor-metric-card__icon ${metric.tone}`}>{metric.icon}</span>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>

          <section className="vendor-dashboard__upcoming">
            <div className="vendor-dashboard__upcoming-header">
              <div>
                <h2>Próximas actividades</h2>
                <p>Reservas y visitas pendientes de pago o confirmación, o que llegan en los próximos 7 días, de todos tus servicios.</p>
              </div>

              <div className="service-owner-dashboard__switcher" role="tablist" aria-label="Filtro de próximas actividades">
                <button
                  type="button"
                  className={upcomingTab === 'ambas' ? 'is-active' : ''}
                  onClick={() => setUpcomingTab('ambas')}
                >
                  Ambas
                </button>
                <button
                  type="button"
                  className={upcomingTab === 'reservas' ? 'is-active' : ''}
                  onClick={() => setUpcomingTab('reservas')}
                >
                  Reservas
                </button>
                <button
                  type="button"
                  className={upcomingTab === 'visitas' ? 'is-active' : ''}
                  onClick={() => setUpcomingTab('visitas')}
                >
                  Visitas
                </button>
              </div>
            </div>

            {visibleUpcomingItems.length === 0 ? (
              <div className="service-owner-dashboard__empty-state">
                <p>No tenés actividades pendientes ni próximas por ahora.</p>
              </div>
            ) : (
              <div className="service-owner-dashboard__list vendor-dashboard__upcoming-list">
                {visibleUpcomingItems.map((item) =>
                  item.kind === 'visita' ? (
                    <UpcomingVisitCard
                      key={`visita-${item.visit.id}`}
                      visit={item.visit}
                      service={item.service}
                      onNavigate={() => goToServiceDashboard(item.service)}
                    />
                  ) : (
                    <UpcomingReservationCard
                      key={`reserva-${item.reservation.id}`}
                      reservation={item.reservation}
                      service={item.service}
                      onNavigate={() => goToServiceDashboard(item.service)}
                    />
                  ),
                )}
              </div>
            )}
          </section>

          <section className="vendor-dashboard__services">
            <div className="vendor-dashboard__services-header">
              <div>
                <h2>Servicios asociados</h2>
                <p>{serviceCountLabel}</p>
              </div>
            </div>

            {error && (
              <div className="vendor-dashboard__state vendor-dashboard__state--error" role="alert">
                {error}
              </div>
            )}

            {!loading && !error && services.length === 0 && (
              <div className="vendor-dashboard__state">
                <p>No tenés servicios cargados todavía.</p>
                <button type="button" className="vendor-dashboard__create-button" onClick={() => navigate('/services/register')}>
                  Registrar el primer servicio
                </button>
              </div>
            )}

            {!loading && !error && services.length > 0 && (
              <div className="vendor-services-list" aria-label="Servicios del dueño">
                {services.map((service) => (
                  <article key={service.id} className="service-admin-card">
                    <div className="service-admin-card__main">
                      <div className="service-admin-card__headline">
                        <span className="service-admin-card__eyebrow">{service.tipoServicio || 'Servicio'}</span>
                        <h3>{service.nombre || 'Servicio sin nombre'}</h3>
                      </div>

                      <p className="service-admin-card__description">
                        {service.descripcion || 'Este servicio todavía no tiene una descripción cargada.'}
                      </p>

                      <div className="service-admin-card__meta">
                        <span>📍 {service.ubicacion || 'Ubicación no especificada'}</span>
                        <span>💲 Desde $ {currencyFormatter.format(service.precioMinimo)}</span>
                        <span>✅ {service.activo ? 'Activo' : 'Inactivo'}</span>
                      </div>

                      {service.categorias && service.categorias.length > 0 && (
                        <div className="service-admin-card__tags">
                          {service.categorias.slice(0, 3).map((category) => (
                            <span key={category.id} className="service-admin-tag">
                              {category.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="service-admin-card__actions">
                      <button
                        type="button"
                        className="service-admin-card__action"
                        onClick={() => goToServiceDashboard(service)}
                      >
                        Ver detalle dueño
                      </button>
                      <button
                        type="button"
                        className="service-admin-card__action"
                        onClick={() => navigate(`/services/${service.id}/edit`)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="service-admin-card__action service-admin-card__action--danger"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
};

export default VendorDashboardPage;
```

> **Nota:** el único cambio de comportamiento fuera de la sección nueva es que el botón "Ver detalle dueño" ahora llama a `goToServiceDashboard(service)` en vez de repetir `navigate(...)` inline — es la misma navegación exacta, solo extraída para reutilizarla también desde las tarjetas nuevas.

- [ ] **Step 2: Verificar que TypeScript no reporta errores**

```bash
cd BookIt-frontend && npx tsc --noEmit
```

Salida esperada: sin errores nuevos (los mismos que ya existían antes del cambio, si los hubiera).

- [ ] **Step 3: Verificar lint**

```bash
cd BookIt-frontend && npm run lint
```

Salida esperada: sin errores nuevos en `VendorDashboardPage.tsx`.

- [ ] **Step 4: Commit**

```bash
git -C "BookIt-frontend" add src/pages/VendorDashboardPage.tsx
git -C "BookIt-frontend" commit -m "feat: add upcoming activities section to vendor dashboard"
```

---

## Task 2: Agregar estilos de la sección "Próximas actividades" en `App.css`

**Files:**
- Modificar: `BookIt-frontend/src/App.css`

**Interfaces:**
- Produce: clases `.vendor-dashboard__upcoming`, `.vendor-dashboard__upcoming-header`, `.vendor-dashboard__upcoming-list`, `.vendor-dashboard__upcoming-card`

- [ ] **Step 1: Agregar los estilos base justo después de `.vendor-dashboard__services-header p`**

Buscar en `BookIt-frontend/src/App.css` el bloque:

```css
.vendor-dashboard__services-header p {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
}
```

Y agregar inmediatamente después:

```css

.vendor-dashboard__upcoming {
  display: grid;
  gap: 1rem;
}

.vendor-dashboard__upcoming-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.vendor-dashboard__upcoming-header h2 {
  margin: 0;
  font-size: 1.2rem;
  letter-spacing: -0.02em;
}

.vendor-dashboard__upcoming-header p {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
  max-width: 52ch;
}

.vendor-dashboard__upcoming-list {
  max-height: 32rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.vendor-dashboard__upcoming-card {
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.vendor-dashboard__upcoming-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(122, 44, 255, 0.1);
}
```

- [ ] **Step 2: Agregar el ajuste responsive en el media query de 640px**

Buscar en `BookIt-frontend/src/App.css` el bloque:

```css
  .vendor-dashboard__services-header {
    align-items: flex-start;
    flex-direction: column;
  }
```

Y reemplazarlo por:

```css
  .vendor-dashboard__services-header,
  .vendor-dashboard__upcoming-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .vendor-dashboard__upcoming-list {
    max-height: 24rem;
  }
```

- [ ] **Step 3: Commit**

```bash
git -C "BookIt-frontend" add src/App.css
git -C "BookIt-frontend" commit -m "feat: add styles for vendor dashboard upcoming activities section"
```

---

## Task 3: Verificación manual en el navegador

**Files:** Ninguno (solo verificación)

- [ ] **Step 1: Arrancar el servidor de desarrollo**

```bash
cd BookIt-frontend && npm run dev
```

- [ ] **Step 2: Iniciar sesión como un dueño con al menos 2 servicios, cada uno con reservas y/o visitas en distintos estados**

Si no existen datos de prueba suficientes, crear (desde otro usuario cliente) al menos:
- Una visita pendiente con fecha pasada (vencida)
- Una visita pendiente con fecha dentro de los próximos 7 días
- Una reserva sin confirmar
- Una reserva confirmada con saldo pendiente (pago parcial)
- Una reserva confirmada y totalmente pagada, con fecha dentro de los próximos 7 días
- Una reserva confirmada y totalmente pagada, con fecha fuera de la ventana de 7 días (no debería aparecer)

- [ ] **Step 3: Ir a `/vendor/dashboard` (panel de dueño) y verificar**

1. La sección "Próximas actividades" aparece entre las métricas y "Servicios asociados"
2. La tab "Ambas" está activa por defecto y muestra la mezcla de reservas y visitas de los distintos servicios, ordenadas por fecha ascendente
3. Cada tarjeta muestra el nombre del servicio (🏷) al que pertenece
4. La reserva confirmada y pagada fuera de la ventana de 7 días **no** aparece en la lista
5. Al clickear la tab "Reservas" solo se ven reservas; al clickear "Visitas" solo se ven visitas
6. Al clickear una tarjeta, navega correctamente a `/vendor/services/{id}` mostrando el panel de ese servicio específico
7. Si se filtra a una combinación sin resultados, aparece el mensaje "No tenés actividades pendientes ni próximas por ahora."
8. Si hay muchos ítems, la lista tiene scroll interno y no estira toda la página

- [ ] **Step 4: Verificar responsive**

Reducir el viewport a un ancho móvil (~375px) y confirmar que el header de la sección se apila verticalmente y la lista reduce su altura máxima, sin overflow horizontal.

- [ ] **Step 5: Anotar cualquier ajuste visual necesario y corregir**

Si algo no calza (por ejemplo colores de badge, spacing), ajustar directamente en `App.css` o `VendorDashboardPage.tsx` y commitear el fix:

```bash
git -C "BookIt-frontend" add -A
git -C "BookIt-frontend" commit -m "fix: adjust upcoming activities section after manual QA"
```
