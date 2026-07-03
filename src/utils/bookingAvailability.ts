import type { Service } from '../types/service';

const DEFAULT_START = 8;
const DEFAULT_END = 22;

export type BookingType = 'reserva' | 'visita';

export function getScheduleHours(service: Service, bookingType: BookingType) {
  const startHour =
    bookingType === 'reserva'
      ? (service.horaAperturaReserva ?? DEFAULT_START)
      : (service.horaAperturaVisita ?? DEFAULT_START);
  const endHour =
    bookingType === 'reserva'
      ? (service.horaCierreReserva ?? DEFAULT_END)
      : (service.horaCierreVisita ?? DEFAULT_END);
  return { startHour, endHour };
}

export function generateTimeSlots(startHour = DEFAULT_START, endHour = DEFAULT_END): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const h = String(hour).padStart(2, '0');
    slots.push(`${h}:00`, `${h}:30`);
  }
  return slots;
}

export function isWorkingDay(service: Service, date: Date): boolean {
  const dias = service.diasAtencion;
  if (!dias || dias.length === 0) return true;
  return dias.includes(date.getDay()); // 0=Sunday, 1=Monday, ..., 6=Saturday
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

export type DayStatus = 'past' | 'closed' | 'full' | 'green' | 'yellow' | 'red';

export function getDayStatus(
  service: Service,
  date: Date,
  bookingType: BookingType = 'reserva',
): DayStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d < today) return 'past';
  if (!isWorkingDay(service, date)) return 'closed';

  const { startHour, endHour } = getScheduleHours(service, bookingType);
  const totalSlots = (endHour - startHour) * 2;
  const count = getBookedSlotsForDay(service, date).size;

  if (count >= totalSlots) return 'full';
  if (count <= 2) return 'green';
  if (count <= 5) return 'yellow';
  return 'red';
}
