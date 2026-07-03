import { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import type { Service } from '../types/service';
import type { BookingType } from '../utils/bookingAvailability';
import {
  generateTimeSlots,
  getBookedSlotsForDay,
  getDayStatus,
  getScheduleHours,
  isWorkingDay,
} from '../utils/bookingAvailability';
import 'react-day-picker/dist/style.css';

interface BookingDateTimePickerProps {
  service: Service;
  bookingType: BookingType;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}

const BookingDateTimePicker = ({
  service,
  bookingType,
  value,
  onChange,
  disabled = false,
}: BookingDateTimePickerProps) => {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(() =>
    value ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : undefined,
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { startHour, endHour } = useMemo(
    () => getScheduleHours(service, bookingType),
    [service, bookingType],
  );

  const slots = useMemo(
    () => generateTimeSlots(startHour, endHour),
    [startHour, endHour],
  );

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
      if (h < now.getHours() || (h === now.getHours() && m < now.getMinutes())) {
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

  const disabledMatchers = useMemo(
    () => [
      { before: today },
      (date: Date) =>
        disabled ||
        !isWorkingDay(service, date) ||
        getDayStatus(service, date, bookingType) === 'full',
    ],
    [today, disabled, service, bookingType],
  );

  const modifiers = useMemo(
    () => ({
      green: (date: Date) => getDayStatus(service, date, bookingType) === 'green',
      yellow: (date: Date) => getDayStatus(service, date, bookingType) === 'yellow',
      red: (date: Date) => getDayStatus(service, date, bookingType) === 'red',
      full: (date: Date) => getDayStatus(service, date, bookingType) === 'full',
      closed: (date: Date) => !isWorkingDay(service, date),
    }),
    [service, bookingType],
  );

  return (
    <div className="booking-picker">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={handleDaySelect}
        locale={es}
        disabled={disabledMatchers}
        modifiers={modifiers}
        modifiersClassNames={{
          green: 'booking-day--green',
          yellow: 'booking-day--yellow',
          red: 'booking-day--red',
          full: 'booking-day--full',
          closed: 'booking-day--closed',
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
