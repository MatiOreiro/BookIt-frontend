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
