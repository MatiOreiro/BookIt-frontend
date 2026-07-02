# Booking Date/Time Picker — Design Spec

**Date:** 2026-06-28  
**Scope:** Entrega 1 de 2 — picker mejorado con disponibilidad visual  
**Entrega 2 (fuera de scope):** horarios configurables por salón (requiere cambios de modelo en backend)

---

## Contexto

La página `ServiceReservationPage` actualmente usa un `<input type="datetime-local">` que permite seleccionar cualquier fecha y hora, incluyendo fechas pasadas. No hay feedback visual sobre disponibilidad. Este spec define la entrega 1: un picker con calendario visual coloreado y grilla de turnos con slots ocupados deshabilitados.

---

## Objetivos

1. Impedir la selección de fechas pasadas
2. Mostrar turnos disponibles cada 30 minutos (08:00–22:00, hardcoded para esta entrega)
3. Deshabilitar turnos ya ocupados (reservas + visitas existentes)
4. Colorear los días del calendario según nivel de ocupación
5. Mantener el mismo formato ISO que se envía al backend (sin cambios de API)

---

## Arquitectura

### Archivos nuevos

**`src/components/BookingDateTimePicker.tsx`**  
Componente React que encapsula el calendario y la grilla de turnos. Props:
```ts
interface BookingDateTimePickerProps {
  service: Service;
  value: Date | null;
  onChange: (date: Date | null) => void;
}
```
Internamente gestiona `selectedDay: Date | null` y `selectedSlot: string | null`. Cuando ambos están definidos, construye un `Date` y llama `onChange`. Si el usuario cambia de día, resetea el slot seleccionado.

**`src/utils/bookingAvailability.ts`**  
Utilidades puras sin estado React:

- `generateTimeSlots(): string[]` — devuelve `["08:00", "08:30", ..., "21:30"]` (28 slots)
- `getBookedSlotsForDay(service: Service, date: Date): Set<string>` — extrae todos los horarios ocupados (reservas + visitas) para el día dado, normalizados a `"HH:MM"`
- `getDayStatus(service: Service, date: Date): 'past' | 'full' | 'green' | 'yellow' | 'red'` — determina el estado visual del día

### Modificación existente

**`src/pages/ServiceReservationPage.tsx`**
- Estado `fechaHoraSolicitada` cambia de `string` a `Date | null`
- Se elimina `buildDefaultDateTime()`
- El `<input type="datetime-local">` se reemplaza por `<BookingDateTimePicker service={service} value={fechaHoraSolicitada} onChange={setFechaHoraSolicitada} />`
- El botón submit queda deshabilitado si `value` es `null`
- En el payload del submit: `new Date(fechaHoraSolicitada).toISOString()` → `fechaHoraSolicitada.toISOString()`

---

## Lógica de disponibilidad

### Rango horario
- Fijo: 08:00 a 22:00, cada 30 minutos = 28 slots por día
- La entrega 2 lo hará configurable por salón desde el backend

### Estado de un día en el calendario

| Condición | Estado | Color CSS |
|---|---|---|
| Fecha anterior a hoy | `past` | Gris, deshabilitado |
| Todos los 28 slots ocupados | `full` | Gris, deshabilitado |
| 0–2 bookings (reservas+visitas) | `green` | Verde |
| 3–5 bookings | `yellow` | Amarillo |
| 6+ bookings | `red` | Rojo |

Los bookings se cuentan sumando `service.reservas` y `service.visitas` para ese día (por fecha, ignorando hora).

### Estado de un slot en la grilla

Un slot está **ocupado** si su hora `"HH:MM"` aparece en:
- `service.reservas[].fechaReservaCliente` (mismo día)
- `service.visitas[].fechaHoraSolicitada` (mismo día)

Un slot está **pasado** si el día seleccionado es hoy y la hora ya transcurrió.

Slots ocupados y pasados se renderizan como botones deshabilitados en gris.

---

## Layout visual

### Calendario (react-day-picker)
- Navegación mensual con flechas
- Días coloreados con clases CSS custom pasadas vía `modifiersClassNames`
- Días pasados deshabilitados con `disabled` modifier
- Al hacer click en un día disponible, se muestra la grilla de turnos

### Grilla de turnos
- Aparece debajo del calendario tras seleccionar un día
- Título: "Turnos para el [día], [fecha]" (ej: "Turnos para el sábado 28 de junio")
- Layout: grilla de 4 columnas con botones de ancho fijo
- Slot disponible: botón clickeable con hover
- Slot ocupado: botón deshabilitado, gris, texto tachado
- Slot seleccionado: destacado con color primario de la app

### CSS
- Clases propias para el picker (`.booking-picker`, `.booking-picker__slots`, etc.)
- Se importan solo los estilos base mínimos de react-day-picker, sobreescritos con variables del proyecto
- Sin estilos globales que afecten el resto de la app

---

## Dependencias nuevas

```
react-day-picker   (calendario)
date-fns           (peer dep de react-day-picker, formateo de fechas)
```

---

## Sin cambios en el backend

El payload enviado a la API no cambia. Sigue siendo un ISO string en `FechaReservaCliente` / `FechaHoraSolicitada`. El cambio es puramente de UI.

---

## Fuera de scope (Entrega 2)

- Horarios de atención configurables por salón (distintos para reservas vs visitas)
- Días laborables configurables por salón
- Bloqueo de días completos desde el panel del vendor
