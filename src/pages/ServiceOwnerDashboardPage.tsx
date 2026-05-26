import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getServiceById } from '../services/serviceService';
import type { ReservationDto, Service } from '../types/service';

type DashboardView = 'calendario' | 'lista';

type MetricCard = {
  label: string;
  value: string;
  tone: 'is-warning' | 'is-success' | 'is-info' | 'is-purple';
  icon: string;
};

const currencyFormatter = new Intl.NumberFormat('es-UY');
const monthFormatter = new Intl.DateTimeFormat('es-UY', { month: 'long', year: 'numeric' });
const dayLabelFormatter = new Intl.DateTimeFormat('es-UY', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const dateFormatter = new Intl.DateTimeFormat('es-UY', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('es-UY', {
  hour: '2-digit',
  minute: '2-digit',
});

const capitalizeText = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseReservationDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

const startOfMondayWeek = (date: Date) => {
  const next = new Date(date);
  const dayIndex = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - dayIndex);
  return next;
};

const endOfSundayWeek = (date: Date) => {
  const next = new Date(date);
  const dayIndex = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() + (6 - dayIndex));
  return next;
};

const sortReservations = (reservations: ReservationDto[]) =>
  [...reservations].sort((left, right) => {
    const leftDate = parseReservationDate(left.fechaReservaCliente)?.getTime() ?? 0;
    const rightDate = parseReservationDate(right.fechaReservaCliente)?.getTime() ?? 0;
    return leftDate - rightDate;
  });

const groupReservationsByDay = (reservations: ReservationDto[]) =>
  reservations.reduce<Record<string, ReservationDto[]>>((accumulator, reservation) => {
    const parsedDate = parseReservationDate(reservation.fechaReservaCliente);
    if (!parsedDate) {
      return accumulator;
    }

    const key = getDateKey(parsedDate);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(reservation);
    return accumulator;
  }, {});

const getReservationBadge = (confirmed: boolean) =>
  confirmed ? 'booking-badge is-confirmed' : 'booking-badge is-prebooking';

const getDayClassName = (isCurrentMonth: boolean, isSelected: boolean, hasReservations: boolean) =>
  [
    'service-owner-dashboard__day',
    isCurrentMonth ? '' : 'is-outside-month',
    isSelected ? 'is-selected' : '',
    hasReservations ? 'has-reservations' : '',
  ].filter(Boolean).join(' ');

const buildDaySummary = (total: number, confirmed: number, pending: number) => {
  const reservationLabel = total === 1 ? 'reserva' : 'reservas';
  const confirmedLabel = confirmed === 1 ? 'confirmada' : 'confirmadas';
  const pendingLabel = pending === 1 ? 'pre-reserva' : 'pre-reservas';

  return `${total} ${reservationLabel} en este día. ${confirmed} ${confirmedLabel} y ${pending} ${pendingLabel}.`;
};

interface ReservationCardProps {
  reservation: ReservationDto;
  variant?: 'calendar' | 'list';
}

const ReservationCard = ({ reservation, variant = 'list' }: ReservationCardProps) => {
  const reservationDate = parseReservationDate(reservation.fechaReservaCliente);

  return (
    <article className={`service-owner-dashboard__reservation-card${variant === 'list' ? ' service-owner-dashboard__reservation-card--list' : ''}`}>
      <div className="service-owner-dashboard__reservation-card-main">
        <div className="service-owner-dashboard__reservation-headline">
          <h3>{reservation.usuario?.nombre || 'Cliente sin nombre'}</h3>
          <span className={getReservationBadge(reservation.confirmada)}>
            {reservation.confirmada ? 'Confirmada' : 'Pre-reserva'}
          </span>
        </div>

        <div className="service-owner-dashboard__reservation-meta">
          <span>🕒 {reservationDate ? timeFormatter.format(reservationDate) : '--:--'}</span>
          <span>📅 {reservationDate ? dateFormatter.format(reservationDate) : 'Fecha no disponible'}</span>
        </div>

        <div className="service-owner-dashboard__reservation-contact">
          <span>✉️ {reservation.usuario?.email || 'Sin email'}</span>
          <span>📞 {reservation.usuario?.telefono || 'Sin teléfono'}</span>
        </div>
      </div>
    </article>
  );
};

interface ServiceOwnerHeaderProps {
  service: Service;
  userName: string;
  reservationCount: number;
  onBack: () => void;
  onEdit: () => void;
}

const ServiceOwnerHeader = ({ service, userName, reservationCount, onBack, onEdit }: ServiceOwnerHeaderProps) => (
  <div className="service-owner-dashboard__header">
    <div className="service-owner-dashboard__hero-copy">
      <button type="button" className="service-owner-dashboard__back" onClick={onBack}>
        ← Volver al panel dueño
      </button>
      <p className="service-owner-dashboard__eyebrow">Panel de servicio</p>
      <h1>{service.nombre}</h1>
      <p className="service-owner-dashboard__subtitle">
        Vista resumida de este servicio con sus reservas, sus movimientos del mes y acceso rápido a los cambios.
      </p>
      <div className="service-owner-dashboard__meta">
        <span>👤 {userName}</span>
        <span>📍 {service.ubicacion || 'Ubicación no especificada'}</span>
        <span>🏷 {service.tipoServicio || 'Servicio'}</span>
        <span>✅ {service.activo ? 'Activo' : 'Inactivo'}</span>
        <span>👥 {reservationCount} reservas</span>
      </div>
    </div>

    <div className="service-owner-dashboard__actions">
      <button type="button" className="vendor-dashboard__create-button" onClick={onEdit}>
        Editar servicio
      </button>
    </div>
  </div>
);

interface ServiceOwnerMetricsProps {
  metrics: MetricCard[];
}

const ServiceOwnerMetrics = ({ metrics }: ServiceOwnerMetricsProps) => (
  <div className="vendor-metrics service-owner-dashboard__metrics">
    {metrics.map((metric) => (
      <article key={metric.label} className="vendor-metric-card">
        <span className={`vendor-metric-card__icon ${metric.tone}`}>{metric.icon}</span>
        <strong>{metric.value}</strong>
        <span>{metric.label}</span>
      </article>
    ))}
  </div>
);

interface ServiceOwnerCalendarViewProps {
  viewMonth: Date;
  calendarDays: Date[];
  reservationsByDay: Record<string, ReservationDto[]>;
  activeSelectedDayKey: string | null;
  selectedDayLabel: string;
  selectedDaySummary: string;
  selectedDayReservations: ReservationDto[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDay: (key: string) => void;
  onClearDay: () => void;
}

const ServiceOwnerCalendarView = ({
  viewMonth,
  calendarDays,
  reservationsByDay,
  activeSelectedDayKey,
  selectedDayLabel,
  selectedDaySummary,
  selectedDayReservations,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onSelectDay,
  onClearDay,
}: ServiceOwnerCalendarViewProps) => {
  const dayReservationsCount = selectedDayReservations.length;

  return (
    <div className="service-owner-dashboard__calendar-layout">
      <section className="service-owner-dashboard__calendar-card">
        <div className="service-owner-dashboard__calendar-header">
          <div>
            <h2>{capitalizeText(monthFormatter.format(viewMonth))}</h2>
            <p>Seleccioná un día para ver sus reservas.</p>
          </div>

          <div className="service-owner-dashboard__calendar-controls">
            <button type="button" onClick={onPreviousMonth}>
              ←
            </button>
            <button type="button" onClick={onToday}>
              Hoy
            </button>
            <button type="button" onClick={onNextMonth}>
              →
            </button>
          </div>
        </div>

        <div className="service-owner-dashboard__weekday-row" aria-hidden="true">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="service-owner-dashboard__calendar-grid">
          {calendarDays.map((date) => {
            const key = getDateKey(date);
            const dayReservations = reservationsByDay[key] ?? [];
            const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
            const isSelected = key === activeSelectedDayKey;
            const confirmedReservations = dayReservations.filter((reservation) => reservation.confirmada).length;
            const pendingReservations = dayReservations.length - confirmedReservations;

            return (
              <button
                key={key}
                type="button"
                className={getDayClassName(isCurrentMonth, isSelected, dayReservations.length > 0)}
                onClick={() => onSelectDay(key)}
              >
                <span className="service-owner-dashboard__day-number">{date.getDate()}</span>
                {dayReservations.length > 0 && (
                  <span className="service-owner-dashboard__day-count">
                    {dayReservations.length} reserva{dayReservations.length === 1 ? '' : 's'}
                  </span>
                )}
                {dayReservations.length > 0 && (
                  <span className="service-owner-dashboard__day-balance">
                    {confirmedReservations} confirmada{confirmedReservations === 1 ? '' : 's'} / {pendingReservations} pre-reserva{pendingReservations === 1 ? '' : 's'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="service-owner-dashboard__day-detail">
        <div className="service-owner-dashboard__day-detail-header">
          <div>
            <h2>{selectedDayLabel}</h2>
            <p>{selectedDaySummary}</p>
          </div>

          {activeSelectedDayKey && (
            <button type="button" className="service-owner-dashboard__day-detail-close" onClick={onClearDay}>
              Limpiar
            </button>
          )}
        </div>

        {dayReservationsCount === 0 ? (
          <div className="service-owner-dashboard__empty-state">
            <p>Elegí un día con reservas para ver el detalle.</p>
          </div>
        ) : (
          <div className="service-owner-dashboard__day-list">
            {selectedDayReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} variant="calendar" />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};

interface ServiceOwnerListViewProps {
  reservations: ReservationDto[];
}

const ServiceOwnerListView = ({ reservations }: ServiceOwnerListViewProps) => (
  <div className="service-owner-dashboard__list-view">
    <div className="service-owner-dashboard__list-summary">
      <h2>Reservas ordenadas por fecha</h2>
      <p>Las más próximas aparecen arriba y las más lejanas abajo.</p>
    </div>

    {reservations.length === 0 ? (
      <div className="service-owner-dashboard__empty-state">
        <p>No hay reservas para este servicio todavía.</p>
      </div>
    ) : (
      <div className="service-owner-dashboard__list">
        {reservations.map((reservation) => (
          <ReservationCard key={reservation.id} reservation={reservation} variant="list" />
        ))}
      </div>
    )}
  </div>
);

const ServiceOwnerDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  const serviceFromState = (location.state as { service?: Service } | null | undefined)?.service;
  const [service, setService] = useState<Service | null>(serviceFromState ?? null);
  const [loading, setLoading] = useState(!serviceFromState);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<DashboardView>('calendario');
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectionTouched, setSelectionTouched] = useState(false);

  useEffect(() => {
    const loadService = async () => {
      if (serviceFromState) {
        setService(serviceFromState);
        setLoading(false);
        setError(null);
        return;
      }

      if (!id) {
        setError('No se encontró el servicio solicitado.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedService = await getServiceById(id);
        setService(fetchedService);
      } catch (serviceError) {
        console.error('Error cargando el panel del servicio', serviceError);
        setError('No se pudo cargar el servicio.');
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id, serviceFromState]);

  const reservations = useMemo(() => sortReservations(service?.reservas ?? []), [service]);
  const reservationsByDay = useMemo(() => groupReservationsByDay(reservations), [reservations]);
  const firstReservationKey = useMemo(() => {
    const firstReservation = reservations[0];
    const parsedDate = firstReservation ? parseReservationDate(firstReservation.fechaReservaCliente) : null;
    return parsedDate ? getDateKey(parsedDate) : null;
  }, [reservations]);
  const activeSelectedDayKey = selectionTouched ? selectedDayKey : firstReservationKey;
  const selectedDayReservations = activeSelectedDayKey ? (reservationsByDay[activeSelectedDayKey] ?? []) : [];
  const selectedDayDate = activeSelectedDayKey ? parseReservationDate(selectedDayReservations[0]?.fechaReservaCliente ?? '') : null;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startGrid = startOfMondayWeek(monthStart);
    const endGrid = endOfSundayWeek(monthEnd);
    const days: Date[] = [];

    const cursor = new Date(startGrid);
    while (cursor <= endGrid) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [viewMonth]);

  const metrics = useMemo(() => {
    const preReservations = reservations.filter((reservation) => !reservation.confirmada);
    const confirmedReservations = reservations.filter((reservation) => reservation.confirmada);
    const baseValue = service?.precioMinimo ?? 0;

    return [
      { label: 'Pre-reservas', value: String(preReservations.length), tone: 'is-warning', icon: '▣' },
      { label: 'Reservas confirmadas', value: String(confirmedReservations.length), tone: 'is-success', icon: '▣' },
      { label: 'Ingresos generales', value: `$ ${currencyFormatter.format(confirmedReservations.length * baseValue)}`, tone: 'is-info', icon: '$' },
      { label: 'Ingresos potenciales', value: `$ ${currencyFormatter.format(reservations.length * baseValue)}`, tone: 'is-purple', icon: '⇢' },
    ];
  }, [reservations, service?.precioMinimo]);

  const sortedReservations = useMemo(() => sortReservations(reservations), [reservations]);

  const handleBack = () => {
    navigate('/vendor/dashboard');
  };

  const handleEdit = () => {
    if (!service) {
      return;
    }

    navigate(`/services/${service.id}/edit`);
  };

  const handleSelectDay = (key: string) => {
    setSelectionTouched(true);
    setSelectedDayKey(key);
  };

  const handleClearDay = () => {
    setSelectionTouched(true);
    setSelectedDayKey(null);
  };

  if (loading && !service) {
    return (
      <div className="service-owner-dashboard">
        <div className="app-shell service-owner-dashboard__shell">
          <div className="service-owner-dashboard__state">
            <p>Cargando el panel del servicio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="service-owner-dashboard">
        <div className="app-shell service-owner-dashboard__shell">
          <div className="service-owner-dashboard__state service-owner-dashboard__state--error" role="alert">
            <p>{error || 'No se pudo abrir el panel del servicio.'}</p>
            <button type="button" className="vendor-dashboard__create-button" onClick={handleBack}>
              Volver al panel dueño
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedDayLabel = selectedDayDate ? capitalizeText(dayLabelFormatter.format(selectedDayDate)) : 'Seleccioná un día';
  const dayReservationsCount = selectedDayReservations.length;
  const confirmedCount = selectedDayReservations.filter((reservation) => reservation.confirmada).length;
  const pendingCount = dayReservationsCount - confirmedCount;
  const selectedDaySummary = dayReservationsCount === 0
    ? 'No hay reservas para este día.'
    : buildDaySummary(dayReservationsCount, confirmedCount, pendingCount);

  return (
    <div className="service-owner-dashboard">
      <section className="service-owner-dashboard__hero">
        <div className="app-shell service-owner-dashboard__shell">
          <ServiceOwnerHeader
            service={service}
            userName={user?.name || 'Tu cuenta'}
            reservationCount={service.reservas?.length ?? 0}
            onBack={handleBack}
            onEdit={handleEdit}
          />

          <ServiceOwnerMetrics metrics={metrics} />

          <section className="service-owner-dashboard__content">
            <div className="service-owner-dashboard__switcher" role="tablist" aria-label="Vista de reservas del servicio">
              <button type="button" className={view === 'calendario' ? 'is-active' : ''} onClick={() => setView('calendario')}>
                Calendario
              </button>
              <button type="button" className={view === 'lista' ? 'is-active' : ''} onClick={() => setView('lista')}>
                Lista
              </button>
            </div>

            {view === 'calendario' ? (
              <ServiceOwnerCalendarView
                viewMonth={viewMonth}
                calendarDays={calendarDays}
                reservationsByDay={reservationsByDay}
                activeSelectedDayKey={activeSelectedDayKey}
                selectedDayLabel={selectedDayLabel}
                selectedDaySummary={selectedDaySummary}
                selectedDayReservations={selectedDayReservations}
                onPreviousMonth={() => setViewMonth((current) => addMonths(current, -1))}
                onNextMonth={() => setViewMonth((current) => addMonths(current, 1))}
                onToday={() => setViewMonth(startOfMonth(new Date()))}
                onSelectDay={handleSelectDay}
                onClearDay={handleClearDay}
              />
            ) : (
              <ServiceOwnerListView reservations={sortedReservations} />
            )}
          </section>
        </div>
      </section>
    </div>
  );
};

export default ServiceOwnerDashboardPage;