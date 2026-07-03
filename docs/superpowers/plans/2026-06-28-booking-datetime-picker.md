# Booking Date/Time Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el `<input type="datetime-local">` de la página de reserva con un picker de calendario visual con días coloreados por disponibilidad y una grilla de turnos cada 30 minutos.

**Architecture:** Utilidades puras en `bookingAvailability.ts` calculan disponibilidad a partir del objeto `service` ya cargado (no se necesitan endpoints nuevos). Un componente `BookingDateTimePicker` encapsula react-day-picker con días coloreados + grilla de botones de turnos. `ServiceReservationPage` reemplaza el input por el componente nuevo.

**Tech Stack:** Next.js 14, React 18, TypeScript, react-day-picker v8, date-fns, CSS custom en `src/App.css`

## Global Constraints

- No cambiar el formato ISO que se envía al backend — solo cambia la UI
- Horario de turnos fijo: 08:00–22:00, cada 30 minutos (28 slots/día) — configurable por salón en Entrega 2
- Colores de días: verde = 0–2 bookings, amarillo = 3–5, rojo = 6+, gris = pasado o todos los slots ocupados
- Reservas + visitas cuentan juntas para el color del día
- CSS en `src/App.css` (importado en `pages/_app.tsx`)
- Spec completo en `docs/superpowers/specs/2026-06-28-booking-datetime-picker-design.md`

---

## File Map

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Crear | `src/utils/bookingAvailability.ts` | Funciones puras: slots, estado de día, slots ocupados |
| Crear | `src/components/BookingDateTimePicker.tsx` | Componente React: calendario + grilla de turnos |
| Modificar | `src/App.css` | Estilos del picker y colores de disponibilidad |
| Modificar | `src/pages/ServiceReservationPage.tsx` | Integrar el nuevo componente, actualizar estado y submit |

---

## Task 1: Branch git + Instalar dependencias

**Files:**
- Ninguno (setup)

- [ ] **Step 1: Crear branch**

```bash
git -C "BookIt-frontend" checkout -b feature/booking-datetime-picker
```

- [ ] **Step 2: Instalar react-day-picker v8 y date-fns**

```bash
cd BookIt-frontend && npm install react-day-picker@8 date-fns
```

Salida esperada: mensaje de npm indicando que se instalaron los paquetes sin errores.

- [ ] **Step 3: Verificar instalación**

Confirmar que en `BookIt-frontend/package.json` aparecen las dos dependencias:

```json
"date-fns": "^x.x.x",
"react-day-picker": "^8.x.x"
```

- [ ] **Step 4: Commit de setup**

```bash
git -C "BookIt-frontend" add package.json package-lock.json
git -C "BookIt-frontend" commit -m "chore: install react-day-picker v8 and date-fns"
```

---

## Task 2: Crear `src/utils/bookingAvailability.ts`

**Files:**
- Crear: `BookIt-frontend/src/utils/bookingAvailability.ts`

**Interfaces:**
- Consume: `Service`, `ReservationDto`, `VisitDto` de `../types/service`
- Produce:
  - `generateTimeSlots(): string[]`
  - `getBookedSlotsForDay(service: Service, date: Date): Set<string>`
  - `DayStatus = 'past' | 'full' | 'green' | 'yellow' | 'red'`
  - `getDayStatus(service: Service, date: Date): DayStatus`

- [ ] **Step 1: Crear el archivo con las utilidades**

Crear `BookIt-frontend/src/utils/bookingAvailability.ts` con el siguiente contenido:

```typescript
import type { Service } from '../types/service';

const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 22;

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = SLOT_START_HOUR; hour < SLOT_END_HOUR; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
    slots.push(`${String(hour).padStart(2, '0')}:30`);
  }
  return slots;
}

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function getBookedSlotsForDay(service: Service, date: Date): Set<string> {
  const dayKey = toLocalDateKey(date);
  const booked = new Set<string>();

  for (const reserva of service.reservas ?? []) {
    if (!reserva.fechaReservaCliente) continue;
    const d = new Date(reserva.fechaReservaCliente);
    if (toLocalDateKey(d) === dayKey) booked.add(toTimeString(d));
  }

  for (const visita of service.visitas ?? []) {
    if (!visita.fechaHoraSolicitada) continue;
    const d = new Date(visita.fechaHoraSolicitada);
    if (toLocalDateKey(d) === dayKey) booked.add(toTimeString(d));
  }

  return booked;
}

export type DayStatus = 'past' | 'full' | 'green' | 'yellow' | 'red';

export function getDayStatus(service: Service, date: Date): DayStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d < today) return 'past';

  const dayKey = toLocalDateKey(date);
  const count =
    (service.reservas ?? []).filter(
      (r) => r.fechaReservaCliente && toLocalDateKey(new Date(r.fechaReservaCliente)) === dayKey,
    ).length +
    (service.visitas ?? []).filter(
      (v) => v.fechaHoraSolicitada && toLocalDateKey(new Date(v.fechaHoraSolicitada)) === dayKey,
    ).length;

  if (count >= generateTimeSlots().length) return 'full';
  if (count <= 2) return 'green';
  if (count <= 5) return 'yellow';
  return 'red';
}
```

- [ ] **Step 2: Verificar manualmente la lógica de `generateTimeSlots`**

Abrir la consola del navegador (o Node) y ejecutar:

```js
// Debe retornar array de 28 strings: ["08:00", "08:30", ..., "21:30"]
generateTimeSlots().length === 28
generateTimeSlots()[0] === "08:00"
generateTimeSlots()[27] === "21:30"
```

- [ ] **Step 3: Commit**

```bash
git -C "BookIt-frontend" add src/utils/bookingAvailability.ts
git -C "BookIt-frontend" commit -m "feat: add booking availability utility functions"
```

---

## Task 3: Crear `src/components/BookingDateTimePicker.tsx`

**Files:**
- Crear: `BookIt-frontend/src/components/BookingDateTimePicker.tsx`

**Interfaces:**
- Consume: `generateTimeSlots`, `getBookedSlotsForDay`, `getDayStatus` de `../utils/bookingAvailability`
- Consume: `Service` de `../types/service`
- Produce:
  ```typescript
  interface BookingDateTimePickerProps {
    service: Service;
    value: Date | null;
    onChange: (date: Date | null) => void;
    disabled?: boolean;
  }
  export default BookingDateTimePicker
  ```

- [ ] **Step 1: Crear el componente**

Crear `BookIt-frontend/src/components/BookingDateTimePicker.tsx`:

```tsx
import { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import type { Service } from '../types/service';
import { generateTimeSlots, getBookedSlotsForDay, getDayStatus } from '../utils/bookingAvailability';
import 'react-day-picker/dist/style.css';

interface BookingDateTimePickerProps {
  service: Service;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}

const BookingDateTimePicker = ({ service, value, onChange, disabled = false }: BookingDateTimePickerProps) => {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(() =>
    value ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : undefined,
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const slots = useMemo(() => generateTimeSlots(), []);

  const bookedSlots = useMemo(
    () => (selectedDay ? getBookedSlotsForDay(service, selectedDay) : new Set<string>()),
    [service, selectedDay],
  );

  const pastSlots = useMemo((): Set<string> => {
    if (!selectedDay) return new Set();
    const now = new Date();
    if (selectedDay.toDateString() !== now.toDateString()) return new Set();
    const past = new Set<string>();
    for (const slot of slots) {
      const [h, m] = slot.split(':').map(Number);
      if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) {
        past.add(slot);
      }
    }
    return past;
  }, [selectedDay, slots]);

  const handleDaySelect = (day: Date | undefined) => {
    setSelectedDay(day);
    onChange(null);
  };

  const handleSlotSelect = (slot: string) => {
    if (!selectedDay || disabled) return;
    const [hours, minutes] = slot.split(':').map(Number);
    const combined = new Date(selectedDay);
    combined.setHours(hours, minutes, 0, 0);
    onChange(combined);
  };

  const selectedSlot = value
    ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    : null;

  const dayLabel = selectedDay
    ? selectedDay.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <div className="booking-picker">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={handleDaySelect}
        locale={es}
        disabled={[
          { before: today },
          (date: Date) => disabled || getDayStatus(service, date) === 'full',
        ]}
        modifiers={{
          green: (date: Date) => getDayStatus(service, date) === 'green',
          yellow: (date: Date) => getDayStatus(service, date) === 'yellow',
          red: (date: Date) => getDayStatus(service, date) === 'red',
          full: (date: Date) => getDayStatus(service, date) === 'full',
        }}
        modifiersClassNames={{
          green: 'booking-day--green',
          yellow: 'booking-day--yellow',
          red: 'booking-day--red',
          full: 'booking-day--full',
        }}
      />

      {selectedDay && (
        <div className="booking-picker__slots">
          <p className="booking-picker__slots-title">Turnos para el {dayLabel}</p>
          <div className="booking-picker__slots-grid">
            {slots.map((slot) => {
              const isBooked = bookedSlots.has(slot);
              const isPast = pastSlots.has(slot);
              const isSelected = slot === selectedSlot;
              const isDisabled = isBooked || isPast || disabled;

              return (
                <button
                  key={slot}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSlotSelect(slot)}
                  className={[
                    'booking-picker__slot',
                    isSelected ? 'booking-picker__slot--selected' : '',
                    isBooked ? 'booking-picker__slot--booked' : '',
                    isPast ? 'booking-picker__slot--past' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDateTimePicker;
```

- [ ] **Step 2: Verificar que TypeScript no reporta errores**

```bash
cd BookIt-frontend && npx tsc --noEmit
```

Salida esperada: sin errores (o solo los que ya existían antes de este cambio).

- [ ] **Step 3: Commit**

```bash
git -C "BookIt-frontend" add src/components/BookingDateTimePicker.tsx
git -C "BookIt-frontend" commit -m "feat: add BookingDateTimePicker component"
```

---

## Task 4: Agregar CSS en `src/App.css`

**Files:**
- Modificar: `BookIt-frontend/src/App.css` (agregar al final del archivo)

**Interfaces:**
- Produce: clases `.booking-picker`, `.booking-picker__slots`, `.booking-picker__slots-grid`, `.booking-picker__slot`, variantes de estado y colores de días

- [ ] **Step 1: Agregar los estilos al final de `src/App.css`**

Abrir `BookIt-frontend/src/App.css` y agregar al final:

```css
/* ====== BookingDateTimePicker ====== */

.booking-picker {
  display: grid;
  gap: 1.25rem;
}

/* Override react-day-picker accent colors */
.booking-picker .rdp {
  --rdp-accent-color: var(--primary);
  --rdp-background-color: var(--primary-soft);
  margin: 0;
  font-family: inherit;
}

/* Day availability color indicators */
.booking-picker .rdp-day.booking-day--green {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
  font-weight: 700;
  border-radius: 50%;
}

.booking-picker .rdp-day.booking-day--yellow {
  background: rgba(234, 179, 8, 0.15);
  color: #92400e;
  font-weight: 700;
  border-radius: 50%;
}

.booking-picker .rdp-day.booking-day--red {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
  font-weight: 700;
  border-radius: 50%;
}

.booking-picker .rdp-day.booking-day--full {
  background: rgba(107, 114, 128, 0.08);
  color: #9ca3af;
  border-radius: 50%;
}

/* Time slot section */
.booking-picker__slots {
  display: grid;
  gap: 0.75rem;
}

.booking-picker__slots-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  text-transform: capitalize;
}

.booking-picker__slots-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.booking-picker__slot {
  padding: 0.6rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease, box-shadow 140ms ease;
  text-align: center;
}

.booking-picker__slot:hover:not(:disabled) {
  border-color: rgba(122, 44, 255, 0.35);
  background: rgba(122, 44, 255, 0.06);
  box-shadow: 0 4px 12px rgba(122, 44, 255, 0.1);
}

.booking-picker__slot--selected {
  border-color: var(--primary);
  background: linear-gradient(135deg, var(--primary), #9a43ff);
  color: #fff;
  box-shadow: 0 8px 18px rgba(122, 44, 255, 0.22);
}

.booking-picker__slot--selected:hover:not(:disabled) {
  border-color: var(--primary-strong);
  background: linear-gradient(135deg, var(--primary-strong), #8632f4);
}

.booking-picker__slot--booked,
.booking-picker__slot--past {
  background: rgba(107, 114, 128, 0.07);
  color: #9ca3af;
  border-color: rgba(107, 114, 128, 0.15);
  cursor: not-allowed;
  text-decoration: line-through;
}

@media (max-width: 480px) {
  .booking-picker__slots-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

> **Nota sobre clases de react-day-picker v8:** Los `modifiersClassNames` se aplican al elemento `<button class="rdp-day ...">`. Si al inspeccionar el DOM los estilos de color no aplican, verificar la estructura HTML real y ajustar el selector (puede ser `.rdp-day.booking-day--green` o `.rdp-button.booking-day--green` según la versión exacta).

- [ ] **Step 2: Commit**

```bash
git -C "BookIt-frontend" add src/App.css
git -C "BookIt-frontend" commit -m "feat: add booking picker styles and day availability colors"
```

---

## Task 5: Integrar en `ServiceReservationPage.tsx`

**Files:**
- Modificar: `BookIt-frontend/src/pages/ServiceReservationPage.tsx`

**Interfaces:**
- Consume: `BookingDateTimePicker` de `../components/BookingDateTimePicker`
- El estado `fechaHoraSolicitada` cambia de `string` a `Date | null`

- [ ] **Step 1: Reemplazar el contenido de `ServiceReservationPage.tsx`**

Reemplazar el archivo completo con:

```tsx
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { createReserva, createVisita, getServiceById } from '../services/serviceService';
import type { Service } from '../types/service';
import BookingDateTimePicker from '../components/BookingDateTimePicker';

const moneyFormatter = new Intl.NumberFormat('es-UY');

const ServiceReservationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingType = new URLSearchParams(location.search).get('tipo') === 'reserva' ? 'reserva' : 'visita';
  const isReservation = bookingType === 'reserva';
  const pageTitle = isReservation ? 'Agendar reserva' : 'Agendar visita';
  const submitLabel = isReservation ? 'Reservar' : 'Agendar visita';
  const successMessage = isReservation
    ? 'Tu reserva quedó solicitada. La vas a ver en tu panel de reservas.'
    : 'Tu visita quedó solicitada. La vas a ver en tu panel de visitas.';
  const formHint = isReservation
    ? 'La reserva se registrará como reserva pendiente.'
    : 'La visita se registrará como visita pendiente.';

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fechaHoraSolicitada, setFechaHoraSolicitada] = useState<Date | null>(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const loadService = async () => {
      if (!id) {
        setError('No se encontró el servicio solicitado.');
        setLoading(false);
        return;
      }

      try {
        const foundService = await getServiceById(id);
        setService(foundService);
      } catch {
        setError('No se pudo cargar el servicio.');
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id]);

  const reservationSummary = useMemo(() => {
    if (!service) return '';
    return `${service.nombre} - desde $ ${moneyFormatter.format(service.precioMinimo)}`;
  }, [service]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !service || !fechaHoraSolicitada) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ServiceId: id,
        Mensaje: mensaje.trim() || undefined,
      };

      if (isReservation) {
        await createReserva({
          ...payload,
          FechaReservaCliente: fechaHoraSolicitada.toISOString(),
        });
      } else {
        await createVisita({
          ...payload,
          FechaHoraSolicitada: fechaHoraSolicitada.toISOString(),
        });
      }

      setSuccess(successMessage);
      setMensaje('');
      setFechaHoraSolicitada(null);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'No se pudo crear la reserva.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card auth-card--wide">
          <h1>Reservas</h1>
          <p>Cargando el servicio...</p>
        </div>
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="auth-container">
        <div className="auth-card auth-card--wide">
          <h1>Reservas</h1>
          <div className="auth-error">{error}</div>
          <Link className="btn-primary" to="/services">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--wide">
        <h1>{pageTitle}</h1>
        <p>
          {reservationSummary ||
            (isReservation ? 'Solicitá una reserva para este servicio.' : 'Solicitá una visita para este servicio.')}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <div className="service-detail__reservation-summary">
          <strong>{service?.nombre}</strong>
          <span>{service?.ubicacion || 'Ubicación no especificada'}</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Fecha y hora solicitada</label>
            {service && (
              <BookingDateTimePicker
                service={service}
                value={fechaHoraSolicitada}
                onChange={setFechaHoraSolicitada}
                disabled={submitting}
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="mensaje">Mensaje opcional</label>
            <textarea
              id="mensaje"
              value={mensaje}
              onChange={(event) => setMensaje(event.target.value)}
              placeholder={
                isReservation
                  ? 'Contanos brevemente qué necesitás para la reserva.'
                  : 'Contanos brevemente qué necesitás para la visita.'
              }
              rows={5}
              maxLength={500}
              disabled={submitting}
            />
            <span className="form-group__hint">{formHint}</span>
          </div>

          <div className="service-detail__cta-stack service-detail__cta-stack--form">
            <button
              type="submit"
              className="service-detail__cta service-detail__cta--primary"
              disabled={submitting || !fechaHoraSolicitada}
            >
              {submitting ? 'Enviando...' : submitLabel}
            </button>
            <button
              type="button"
              className="service-detail__cta service-detail__cta--secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceReservationPage;
```

- [ ] **Step 2: Verificar que TypeScript no reporta errores**

```bash
cd BookIt-frontend && npx tsc --noEmit
```

Salida esperada: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git -C "BookIt-frontend" add src/pages/ServiceReservationPage.tsx
git -C "BookIt-frontend" commit -m "feat: replace datetime input with BookingDateTimePicker in reservation page"
```

---

## Task 6: Verificación manual en el navegador

**Files:** Ninguno (solo verificación)

- [ ] **Step 1: Arrancar el servidor de desarrollo**

```bash
cd BookIt-frontend && npm run dev
```

- [ ] **Step 2: Navegar a una página de reserva**

Ir a un servicio existente y clickear "Reservar" o "Agendar visita". Verificar:

1. Aparece un calendario, no un input de texto
2. Los días pasados están en gris y no son clickeables
3. Al hacer click en un día disponible aparece la grilla de turnos debajo
4. Los turnos se muestran en cuadrícula de 4 columnas (08:00 a 21:30)
5. Si hoy es el día seleccionado, los horarios pasados están tachados y deshabilitados
6. Al seleccionar un turno se resalta en morado
7. El botón "Reservar/Agendar visita" está deshabilitado hasta seleccionar día + turno
8. Al enviar el formulario funciona correctamente (el slot se envía como ISO al backend)

- [ ] **Step 3: Verificar colores de días**

Para verificar los colores, crear una reserva de prueba en un servicio y volver a la página de reserva. El día con la reserva debe mostrarse en verde (si tiene 0-2 total). Agregar más reservas de prueba para verificar amarillo (3-5) y rojo (6+).

- [ ] **Step 4: Verificar CSS de `rdp-day` si los colores no aplican**

En el inspector del navegador, buscar un día del calendario. Si la clase del botón es diferente a `rdp-day` (por ejemplo `rdp-button`), actualizar los selectores en `src/App.css`:

Cambiar:
```css
.booking-picker .rdp-day.booking-day--green { ... }
```
Por:
```css
.booking-picker .rdp-button.booking-day--green { ... }
/* o */
.booking-picker [class*="booking-day--green"] { ... }
```

- [ ] **Step 5: Commit final si hubo ajustes de CSS**

```bash
git -C "BookIt-frontend" add src/App.css
git -C "BookIt-frontend" commit -m "fix: adjust booking picker CSS selectors for react-day-picker class names"
```
