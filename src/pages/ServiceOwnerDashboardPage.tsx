import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  asociarServicio,
  confirmReservation,
  confirmVisitAndMaybeCreateReservation,
  getServiceById,
  getServicesByVendorId,
  quitarServicioAsociado,
  rejectReservation,
  rejectVisit,
  updateReservaFinanciero,
} from '../services/serviceService';
import { createPago, updatePago } from '../services/pagoService';
import type { PagoDto, ReservationDto, Service, ServicioAsociadoDto, VisitDto } from '../types/service';

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

const isSalonType = (tipoServicio: string) =>
  tipoServicio.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim().includes('salon');

const capitalizeText = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseReservationDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const canCompleteVisit = (visit: VisitDto) => {
  const parsedDate = parseReservationDate(visit.fechaHoraSolicitada);
  if (!parsedDate) {
    return false;
  }

  return parsedDate.getTime() <= Date.now();
};

const isReservacionPagada = (r: ReservationDto) => {
  const monto = r.montoAcordado ?? 0;
  const pagado = (r.pagos ?? []).reduce((sum, p) => sum + p.importe, 0);
  return monto > 0 && pagado >= monto;
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

const sortVisits = (visits: VisitDto[]) =>
  [...visits].sort((left, right) => {
    const leftDate = parseReservationDate(left.fechaHoraSolicitada)?.getTime() ?? 0;
    const rightDate = parseReservationDate(right.fechaHoraSolicitada)?.getTime() ?? 0;
    return leftDate - rightDate;
  });

const groupVisitsByDay = (visits: VisitDto[]) =>
  visits.reduce<Record<string, VisitDto[]>>((accumulator, visit) => {
    const parsedDate = parseReservationDate(visit.fechaHoraSolicitada);
    if (!parsedDate) {
      return accumulator;
    }

    const key = getDateKey(parsedDate);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(visit);
    return accumulator;
  }, {});

const getReservationBadge = (confirmed: boolean) => (confirmed ? 'booking-badge is-confirmed' : 'booking-badge is-prebooking');

const getDayClassName = (isCurrentMonth: boolean, isSelected: boolean, hasVisits: boolean) =>
  [
    'service-owner-dashboard__day',
    isCurrentMonth ? '' : 'is-outside-month',
    isSelected ? 'is-selected' : '',
    hasVisits ? 'has-reservations' : '',
  ].filter(Boolean).join(' ');

const buildVisitDaySummary = (total: number, pending: number, confirmed: number) => {
  const visitLabel = total === 1 ? 'visita' : 'visitas';
  const pendingLabel = pending === 1 ? 'pendiente' : 'pendientes';
  const confirmedLabel = confirmed === 1 ? 'confirmada' : 'confirmadas';

  return `${total} ${visitLabel} en este día. ${pending} ${pendingLabel} y ${confirmed} ${confirmedLabel}.`;
};

interface VisitCardProps {
  visit: VisitDto;
  onConfirmVisit: (visit: VisitDto) => void;
  onRejectVisit: (visit: VisitDto) => void;
  onViewDetail?: (visit: VisitDto) => void;
}

const VisitCard = ({ visit, onConfirmVisit, onRejectVisit, onViewDetail }: VisitCardProps) => {
  const visitDate = parseReservationDate(visit.fechaHoraSolicitada);
  const isPending = visit.estado.toLowerCase() === 'pendiente';
  const completionAllowed = canCompleteVisit(visit);

  return (
    <article className="service-owner-dashboard__reservation-card service-owner-dashboard__reservation-card--list">
      <div className="service-owner-dashboard__reservation-card-main">
        <div className="service-owner-dashboard__reservation-headline">
          <h3>{visit.userNombre || 'Cliente sin nombre'}</h3>
          <span className={getReservationBadge(!isPending)}>{visit.estado || 'Pendiente'}</span>
        </div>

        <div className="service-owner-dashboard__reservation-meta">
          <span>🕒 {visitDate ? timeFormatter.format(visitDate) : '--:--'}</span>
          <span>📅 {visitDate ? dateFormatter.format(visitDate) : 'Fecha no disponible'}</span>
        </div>

        <div className="service-owner-dashboard__reservation-contact">
          <span>📝 {visit.mensaje || 'Sin mensaje'}</span>
          <span>🏷 {visit.serviceNombre || 'Servicio'}</span>
        </div>
      </div>

      <div className="service-owner-dashboard__visit-actions">
        <button
          type="button"
          className="service-owner-dashboard__visit-action"
          onClick={() => onViewDetail?.(visit)}
        >
          Ver detalle
        </button>
      </div>

      {isPending && (
        <div className="service-owner-dashboard__visit-actions">
          <button
            type="button"
            className="service-owner-dashboard__visit-action"
            onClick={() => onConfirmVisit(visit)}
            disabled={!completionAllowed}
            title={completionAllowed ? 'Confirmar visita realizada' : 'Solo disponible cuando ya pasó la fecha y hora de la visita'}
          >
            Marcar como cumplida
          </button>
          <button type="button" className="service-owner-dashboard__visit-action" onClick={() => onRejectVisit(visit)}>
            Rechazar / eliminar
          </button>
        </div>
      )}
    </article>
  );
};

interface ReservationCardProps {
  reservation: ReservationDto;
  variant?: 'calendar' | 'list';
  onConfirmReservation?: (reservation: ReservationDto) => void;
  onRejectReservation?: (reservation: ReservationDto) => void;
  onViewDetail?: (reservation: ReservationDto) => void;
}

const ReservationCard = ({ reservation, variant = 'list', onConfirmReservation, onRejectReservation, onViewDetail }: ReservationCardProps) => {
  const reservationDate = parseReservationDate(reservation.fechaReservaCliente);

  return (
    <article className={`service-owner-dashboard__reservation-card${variant === 'list' ? ' service-owner-dashboard__reservation-card--list' : ''}`}>
      <div className="service-owner-dashboard__reservation-card-main">
        <div className="service-owner-dashboard__reservation-headline">
          <h3>{reservation.usuario?.nombre || 'Cliente sin nombre'}</h3>
          <span className={getReservationBadge(reservation.confirmada)}>{reservation.confirmada ? 'Confirmada' : 'Pendiente'}</span>
        </div>

        <div className="service-owner-dashboard__reservation-meta">
          <span>🕒 {reservationDate ? timeFormatter.format(reservationDate) : '--:--'}</span>
          <span>📅 {reservationDate ? dateFormatter.format(reservationDate) : 'Fecha no disponible'}</span>
        </div>

        <div className="service-owner-dashboard__reservation-contact">
          <span>✉️ {reservation.usuario?.email || 'Sin email'}</span>
          <span>📞 {reservation.usuario?.telefono || 'Sin teléfono'}</span>
        </div>

        <div className="service-owner-dashboard__visit-actions">
          <button
            type="button"
            className="service-owner-dashboard__visit-action"
            onClick={() => onViewDetail?.(reservation)}
          >
            Ver detalle
          </button>
        </div>
      </div>

      {!reservation.confirmada && onConfirmReservation && onRejectReservation && (
        <div className="service-owner-dashboard__visit-actions">
          <button type="button" className="service-owner-dashboard__visit-action" onClick={() => onConfirmReservation(reservation)}>
            Confirmar reserva
          </button>
          <button type="button" className="service-owner-dashboard__visit-action" onClick={() => onRejectReservation(reservation)}>
            Rechazar reserva
          </button>
        </div>
      )}
    </article>
  );
};

interface ServiceOwnerHeaderProps {
  service: Service;
  reservationCount: number;
  onBack: () => void;
  onEdit: () => void;
  onViewClientDetail: () => void;
}

const ServiceOwnerHeader = ({ service, reservationCount, onBack, onEdit, onViewClientDetail }: ServiceOwnerHeaderProps) => (
  <div className="service-owner-dashboard__header">
    <div className="service-owner-dashboard__hero-copy">
      <button type="button" className="service-owner-dashboard__back" onClick={onBack}>
        ← Volver al panel dueño
      </button>
      <p className="service-owner-dashboard__eyebrow">Panel de servicio</p>
      <h1>{service.nombre}</h1>
      <p className="service-owner-dashboard__subtitle">
        Vista resumida de este servicio con sus visitas, sus reservas y acceso rápido para cerrar cada visita con o sin reserva.
      </p>
      <div className="service-owner-dashboard__meta">
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
      <button type="button" className="vendor-dashboard__create-button service-owner-dashboard__actions-secondary" onClick={onViewClientDetail}>
        Ver detalle cliente
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
  visitsByDay: Record<string, VisitDto[]>;
  reservationsByDay: Record<string, ReservationDto[]>;
  activeSelectedDayKey: string | null;
  selectedDayLabel: string;
  selectedDaySummary: string;
  selectedDayVisits: VisitDto[];
  selectedDayReservations: ReservationDto[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDay: (key: string) => void;
  onClearDay: () => void;
  onConfirmVisit: (visit: VisitDto) => void;
  onRejectVisit: (visit: VisitDto) => void;
  onViewVisitDetail: (visit: VisitDto) => void;
  onConfirmReservation: (reservation: ReservationDto) => void;
  onRejectReservation: (reservation: ReservationDto) => void;
  onViewReservationDetail: (reservation: ReservationDto) => void;
}

const ServiceOwnerCalendarView = ({
  viewMonth,
  calendarDays,
  visitsByDay,
  reservationsByDay,
  activeSelectedDayKey,
  selectedDayLabel,
  selectedDaySummary,
  selectedDayVisits,
  selectedDayReservations,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onSelectDay,
  onClearDay,
  onConfirmVisit,
  onRejectVisit,
  onViewVisitDetail,
  onConfirmReservation,
  onRejectReservation,
  onViewReservationDetail,
}: ServiceOwnerCalendarViewProps) => {
  const dayVisitsCount = selectedDayVisits.length;
  const dayReservationsCount = selectedDayReservations.length;
  const hasSelectedDayItems = dayVisitsCount > 0 || dayReservationsCount > 0;

  const renderSelectedDayContent = () => {
    if (!hasSelectedDayItems) {
      return (
        <div className="service-owner-dashboard__empty-state">
          <p>Elegí un día con visitas o reservas para ver el detalle.</p>
        </div>
      );
    }

    return (
      <div className="service-owner-dashboard__day-list">
        {dayVisitsCount > 0 && selectedDayVisits.map((visit) => (
          <VisitCard key={visit.id} visit={visit} onConfirmVisit={onConfirmVisit} onRejectVisit={onRejectVisit} onViewDetail={onViewVisitDetail} />
        ))}
        {dayReservationsCount > 0 && selectedDayReservations.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            variant="calendar"
            onConfirmReservation={onConfirmReservation}
            onRejectReservation={onRejectReservation}
            onViewDetail={onViewReservationDetail}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="service-owner-dashboard__calendar-layout">
      <section className="service-owner-dashboard__calendar-card">
        <div className="service-owner-dashboard__calendar-header">
          <div>
            <h2>{capitalizeText(monthFormatter.format(viewMonth))}</h2>
            <p>Seleccioná un día para ver sus visitas.</p>
          </div>

          <div className="service-owner-dashboard__calendar-controls">
            <button type="button" onClick={onPreviousMonth}>←</button>
            <button type="button" onClick={onToday}>Hoy</button>
            <button type="button" onClick={onNextMonth}>→</button>
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
            const dayVisits = visitsByDay[key] ?? [];
            const dayReservations = reservationsByDay[key] ?? [];
            const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
            const isSelected = key === activeSelectedDayKey;
            const confirmedVisits = dayVisits.filter((visit) => visit.estado.toLowerCase() === 'confirmada').length;
            const pendingVisits = dayVisits.length - confirmedVisits;
            const hasBookings = dayVisits.length > 0 || dayReservations.length > 0;

            return (
              <button
                key={key}
                type="button"
                className={getDayClassName(isCurrentMonth, isSelected, hasBookings)}
                onClick={() => onSelectDay(key)}
              >
                <span className="service-owner-dashboard__day-number">{date.getDate()}</span>
                {hasBookings && (
                  <span className="service-owner-dashboard__day-count">
                    {dayVisits.length} visita{dayVisits.length === 1 ? '' : 's'} / {dayReservations.length} reserva{dayReservations.length === 1 ? '' : 's'}
                  </span>
                )}
                {dayVisits.length > 0 && (
                  <span className="service-owner-dashboard__day-balance">
                    {confirmedVisits} confirmada{confirmedVisits === 1 ? '' : 's'} / {pendingVisits} pendiente{pendingVisits === 1 ? '' : 's'}
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

        {renderSelectedDayContent()}
      </aside>
    </div>
  );
};

interface ServiceOwnerListViewProps {
  activeTab: 'visitas' | 'reservas';
  onTabChange: (tab: 'visitas' | 'reservas') => void;
  visits: VisitDto[];
  reservations: ReservationDto[];
  onConfirmVisit: (visit: VisitDto) => void;
  onRejectVisit: (visit: VisitDto) => void;
  onViewVisitDetail: (visit: VisitDto) => void;
  onConfirmReservation: (reservation: ReservationDto) => void;
  onRejectReservation: (reservation: ReservationDto) => void;
  onViewReservationDetail: (reservation: ReservationDto) => void;
}

const ServiceOwnerListView = ({
  activeTab,
  onTabChange,
  visits,
  reservations,
  onConfirmVisit,
  onRejectVisit,
  onViewVisitDetail,
  onConfirmReservation,
  onRejectReservation,
  onViewReservationDetail,
}: ServiceOwnerListViewProps) => (
  <div className="service-owner-dashboard__list-view">
    <div className="service-owner-dashboard__switcher" role="tablist" aria-label="Vista de lista">
      <button
        type="button"
        className={activeTab === 'visitas' ? 'is-active' : ''}
        onClick={() => onTabChange('visitas')}
      >
        Visitas
      </button>
      <button
        type="button"
        className={activeTab === 'reservas' ? 'is-active' : ''}
        onClick={() => onTabChange('reservas')}
      >
        Reservas
      </button>
    </div>

    {activeTab === 'visitas' && (
      <>
        <div className="service-owner-dashboard__list-summary">
          <h2>Visitas ordenadas por fecha</h2>
          <p>Las más próximas aparecen arriba y las más lejanas abajo.</p>
        </div>

        {visits.length === 0 ? (
          <div className="service-owner-dashboard__empty-state">
            <p>No hay visitas para este servicio todavía.</p>
          </div>
        ) : (
          <div className="service-owner-dashboard__list">
            {visits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                onConfirmVisit={onConfirmVisit}
                onRejectVisit={onRejectVisit}
                onViewDetail={onViewVisitDetail}
              />
            ))}
          </div>
        )}
      </>
    )}

    {activeTab === 'reservas' && (
      <>
        <div className="service-owner-dashboard__list-summary">
          <h2>Reservas agendadas</h2>
          <p>Estas son las reservas creadas para el servicio, separadas de las visitas.</p>
        </div>

        {reservations.length === 0 ? (
          <div className="service-owner-dashboard__empty-state">
            <p>No hay reservas para este servicio todavía.</p>
          </div>
        ) : (
          <div className="service-owner-dashboard__list">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                variant="list"
                onConfirmReservation={onConfirmReservation}
                onRejectReservation={onRejectReservation}
                onViewDetail={onViewReservationDetail}
              />
            ))}
          </div>
        )}
      </>
    )}
  </div>
);

interface PaymentFormState {
  tipoPago: string;
  importe: string;
  fechaPago: string;
}

const EMPTY_PAYMENT_FORM: PaymentFormState = {
  tipoPago: 'Seña',
  importe: '',
  fechaPago: new Date().toISOString().split('T')[0],
};

interface PaymentFormProps {
  form: PaymentFormState;
  onChange: (form: PaymentFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
}

const PaymentForm = ({ form, onChange, onSubmit, onCancel, submitting, error, submitLabel }: PaymentFormProps) => (
  <div className="service-owner-dashboard__payment-form">
    <select
      value={form.tipoPago}
      onChange={(e) => onChange({ ...form, tipoPago: e.target.value })}
      className="service-owner-dashboard__modal-input"
    >
      <option value="Seña">Seña</option>
      <option value="Parcial">Parcial</option>
      <option value="Total">Total</option>
    </select>
    <input
      type="number"
      min="0"
      step="1"
      value={form.importe}
      onChange={(e) => onChange({ ...form, importe: e.target.value })}
      placeholder="Importe ($)"
      className="service-owner-dashboard__modal-input"
    />
    <input
      type="date"
      value={form.fechaPago}
      onChange={(e) => onChange({ ...form, fechaPago: e.target.value })}
      className="service-owner-dashboard__modal-input"
    />
    {error && <p className="service-owner-dashboard__modal-error" role="alert">{error}</p>}
    <div className="service-owner-dashboard__modal-actions">
      <button type="button" className="service-owner-dashboard__visit-action" onClick={onSubmit} disabled={submitting}>
        {submitLabel}
      </button>
      <button type="button" className="service-owner-dashboard__visit-action" onClick={onCancel} disabled={submitting}>
        Cancelar
      </button>
    </div>
  </div>
);

interface VisitDetailModalProps {
  visit: VisitDto;
  onClose: () => void;
  onConfirmVisit: (visit: VisitDto) => void;
  onRejectVisit: () => Promise<void>;
}

const VisitDetailModal = ({ visit, onClose, onConfirmVisit, onRejectVisit }: VisitDetailModalProps) => {
  const visitDate = parseReservationDate(visit.fechaHoraSolicitada);
  const isPending = visit.estado.toLowerCase() === 'pendiente';
  const completionAllowed = canCompleteVisit(visit);

  const handleConfirm = () => {
    onConfirmVisit(visit);
    onClose();
  };

  const handleReject = async () => {
    await onRejectVisit();
    onClose();
  };

  return (
    <div className="service-owner-dashboard__modal-overlay" role="dialog" aria-modal="true">
      <div className="service-owner-dashboard__modal">
        <div className="service-owner-dashboard__modal-header">
          <h2>Detalle de visita</h2>
          <button type="button" className="service-owner-dashboard__modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="service-owner-dashboard__modal-body">
          <section className="service-owner-dashboard__modal-section">
            <h3>Cliente</h3>
            <p>{visit.userNombre ?? 'Sin nombre'}</p>
            {visit.userEmail && <p>{visit.userEmail}</p>}
          </section>

          <section className="service-owner-dashboard__modal-section">
            <h3>Visita</h3>
            <p><strong>Fecha:</strong> {visitDate ? dateFormatter.format(visitDate) : 'No disponible'}</p>
            <p><strong>Hora:</strong> {visitDate ? timeFormatter.format(visitDate) : 'No disponible'}</p>
            <p><strong>Estado:</strong> {visit.estado}</p>
            {visit.serviceNombre && <p><strong>Servicio:</strong> {visit.serviceNombre}</p>}
            {visit.mensaje && <p><strong>Mensaje:</strong> {visit.mensaje}</p>}
          </section>
        </div>

        {isPending && (
          <div className="service-owner-dashboard__modal-actions">
            <button
              type="button"
              className="service-owner-dashboard__visit-action"
              onClick={handleConfirm}
              disabled={!completionAllowed}
              title={completionAllowed ? undefined : 'Solo disponible cuando ya pasó la fecha y hora de la visita'}
            >
              Marcar como cumplida
            </button>
            <button type="button" className="service-owner-dashboard__visit-action" onClick={handleReject}>
              Rechazar / eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ReservationDetailModalProps {
  reservation: ReservationDto;
  onClose: () => void;
  onDataChange: () => Promise<void>;
}

const ReservationDetailModal = ({ reservation, onClose, onDataChange }: ReservationDetailModalProps) => {
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<PaymentFormState>(EMPTY_PAYMENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editHoras, setEditHoras] = useState(String(reservation.horasReservadas ?? ''));
  const [editMonto, setEditMonto] = useState(String(reservation.montoAcordado ?? ''));
  const [editingFinanciero, setEditingFinanciero] = useState(false);
  const [financieroError, setFinancieroError] = useState<string | null>(null);

  const pagos = reservation.pagos ?? [];
  const totalPagado = pagos.reduce((sum, p) => sum + p.importe, 0);
  const saldoPendiente = (reservation.montoAcordado ?? 0) - totalPagado;
  const reservationDate = parseReservationDate(reservation.fechaReservaCliente);

  const handleNewPago = async () => {
    if (!form.importe || Number(form.importe) <= 0) {
      setFormError('El importe debe ser mayor a cero.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createPago({
        reservaId: reservation.id,
        tipoPago: form.tipoPago,
        importe: Number(form.importe),
        fechaPago: form.fechaPago,
      });
      setShowNewForm(false);
      setForm(EMPTY_PAYMENT_FORM);
      await onDataChange();
    } catch {
      setFormError('No se pudo registrar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPago = async (pagoId: string) => {
    if (!form.importe || Number(form.importe) <= 0) {
      setFormError('El importe debe ser mayor a cero.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await updatePago(pagoId, {
        tipoPago: form.tipoPago,
        importe: Number(form.importe),
        fechaPago: form.fechaPago,
      });
      setEditingPagoId(null);
      setForm(EMPTY_PAYMENT_FORM);
      await onDataChange();
    } catch {
      setFormError('No se pudo actualizar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditPago = (pago: PagoDto) => {
    setEditingPagoId(pago.id);
    setShowNewForm(false);
    setForm({
      tipoPago: pago.tipoPago,
      importe: String(pago.importe),
      fechaPago: pago.fechaPago.split('T')[0],
    });
    setFormError(null);
  };

  const handleUpdateFinanciero = async () => {
    const horasNum = Number(editHoras);
    const montoNum = Number(editMonto);
    if (!editHoras || horasNum < 0.5) {
      setFinancieroError('Las horas deben ser al menos 0.5.');
      return;
    }
    if (horasNum > 24) {
      setFinancieroError('Las horas reservadas no pueden superar las 24.');
      return;
    }
    if (!editMonto || montoNum <= 0) {
      setFinancieroError('El monto debe ser mayor a cero.');
      return;
    }
    setSubmitting(true);
    setFinancieroError(null);
    try {
      await updateReservaFinanciero(reservation.id, { horasReservadas: horasNum, montoAcordado: montoNum });
      setEditingFinanciero(false);
      await onDataChange();
    } catch {
      setFinancieroError('No se pudo actualizar el acuerdo financiero.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="service-owner-dashboard__modal-overlay" role="dialog" aria-modal="true">
      <div className="service-owner-dashboard__modal service-owner-dashboard__modal--wide">
        <div className="service-owner-dashboard__modal-header">
          <h2>Detalle de reserva</h2>
          <button type="button" className="service-owner-dashboard__modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="service-owner-dashboard__modal-body">
          <section className="service-owner-dashboard__modal-section">
            <h3>Cliente</h3>
            <p>{reservation.usuario?.nombre ?? 'Sin nombre'}</p>
            <p>{reservation.usuario?.email ?? 'Sin email'}</p>
            <p>{reservation.usuario?.telefono ?? 'Sin teléfono'}</p>
          </section>

          <section className="service-owner-dashboard__modal-section">
            <h3>Reserva</h3>
            <p><strong>Fecha:</strong> {reservationDate ? dateFormatter.format(reservationDate) : 'No disponible'}</p>
            <p><strong>Hora:</strong> {reservationDate ? timeFormatter.format(reservationDate) : 'No disponible'}</p>
            <p><strong>Estado:</strong> {reservation.confirmada ? 'Confirmada' : 'Pendiente'}</p>
          </section>

          {reservation.confirmada && (
            <section className="service-owner-dashboard__modal-section">
              <div className="service-owner-dashboard__modal-section-header">
                <h3>Acuerdo financiero</h3>
                {!editingFinanciero && (
                  <button
                    type="button"
                    className="service-owner-dashboard__visit-action"
                    onClick={() => { setEditingFinanciero(true); setFinancieroError(null); }}
                  >
                    Editar
                  </button>
                )}
              </div>

              {editingFinanciero ? (
                <div className="service-owner-dashboard__modal-form">
                  <label className="service-owner-dashboard__modal-label">
                    Horas reservadas
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={editHoras}
                      onChange={(e) => setEditHoras(e.target.value)}
                      className="service-owner-dashboard__modal-input"
                    />
                  </label>
                  <label className="service-owner-dashboard__modal-label">
                    Monto acordado ($)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editMonto}
                      onChange={(e) => setEditMonto(e.target.value)}
                      className="service-owner-dashboard__modal-input"
                    />
                  </label>
                  {financieroError && <p className="service-owner-dashboard__modal-error" role="alert">{financieroError}</p>}
                  <div className="service-owner-dashboard__modal-actions">
                    <button type="button" className="service-owner-dashboard__visit-action" onClick={handleUpdateFinanciero} disabled={submitting}>
                      Guardar
                    </button>
                    <button type="button" className="service-owner-dashboard__visit-action" onClick={() => setEditingFinanciero(false)} disabled={submitting}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p><strong>Horas reservadas:</strong> {reservation.horasReservadas ?? '—'}</p>
                  <p><strong>Monto acordado:</strong> $ {currencyFormatter.format(reservation.montoAcordado ?? 0)}</p>
                  <p><strong>Total pagado:</strong> $ {currencyFormatter.format(totalPagado)}</p>
                  <p><strong>Saldo pendiente:</strong> $ {currencyFormatter.format(Math.max(0, saldoPendiente))}</p>
                </>
              )}
            </section>
          )}

          {reservation.confirmada && (
            <section className="service-owner-dashboard__modal-section">
              <h3>Pagos registrados</h3>

              {pagos.length === 0 ? (
                <p>No hay pagos registrados todavía.</p>
              ) : (
                <table className="service-owner-dashboard__pagos-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Importe</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((pago) =>
                      editingPagoId === pago.id ? (
                        <tr key={pago.id}>
                          <td colSpan={5}>
                            <PaymentForm
                              form={form}
                              onChange={setForm}
                              onSubmit={() => handleEditPago(pago.id)}
                              onCancel={() => { setEditingPagoId(null); setForm(EMPTY_PAYMENT_FORM); }}
                              submitting={submitting}
                              error={formError}
                              submitLabel="Guardar cambios"
                            />
                          </td>
                        </tr>
                      ) : (
                        <tr key={pago.id}>
                          <td>{dateFormatter.format(new Date(pago.fechaPago))}</td>
                          <td>{pago.tipoPago}</td>
                          <td>$ {currencyFormatter.format(pago.importe)}</td>
                          <td>
                            <button
                              type="button"
                              className="service-owner-dashboard__visit-action"
                              onClick={() => startEditPago(pago)}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}

              {!showNewForm && !editingPagoId && (
                <button
                  type="button"
                  className="service-owner-dashboard__visit-action"
                  onClick={() => { setShowNewForm(true); setForm(EMPTY_PAYMENT_FORM); setFormError(null); }}
                >
                  + Registrar pago
                </button>
              )}

              {showNewForm && (
                <PaymentForm
                  form={form}
                  onChange={setForm}
                  onSubmit={handleNewPago}
                  onCancel={() => { setShowNewForm(false); setForm(EMPTY_PAYMENT_FORM); setFormError(null); }}
                  submitting={submitting}
                  error={formError}
                  submitLabel="Registrar pago"
                />
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

interface VisitConfirmReservationForm {
  fechaReservaCliente: string;
  horasReservadas: string;
  montoAcordado: string;
}

interface ConfirmVisitModalProps {
  visit: VisitDto;
  onClose: () => void;
  onConfirmWithReservation: (data: { fechaReservaCliente: string; horasReservadas: number; montoAcordado: number }) => Promise<void>;
  onConfirmWithoutReservation: () => Promise<void>;
  onReject: () => Promise<void>;
}

const ConfirmVisitModal = ({ visit, onClose, onConfirmWithReservation, onConfirmWithoutReservation, onReject }: ConfirmVisitModalProps) => {
  const [phase, setPhase] = useState<'options' | 'reservation-form'>('options');
  const [form, setForm] = useState<VisitConfirmReservationForm>({
    fechaReservaCliente: visit.fechaHoraSolicitada
      ? visit.fechaHoraSolicitada.slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    horasReservadas: '',
    montoAcordado: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visitDate = parseReservationDate(visit.fechaHoraSolicitada);

  const handleConfirmWithoutReservation = async () => {
    setSubmitting(true);
    try {
      await onConfirmWithoutReservation();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await onReject();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReservation = async () => {
    const horasNum = Number(form.horasReservadas);
    const montoNum = Number(form.montoAcordado);
    if (!form.fechaReservaCliente) {
      setError('La fecha y hora de la reserva son obligatorias.');
      return;
    }
    if (!form.horasReservadas || horasNum < 0.5) {
      setError('Las horas deben ser al menos 0.5.');
      return;
    }
    if (horasNum > 24) {
      setError('Las horas no pueden superar 24.');
      return;
    }
    if (!form.montoAcordado || montoNum <= 0) {
      setError('El monto debe ser mayor a cero.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirmWithReservation({
        fechaReservaCliente: new Date(form.fechaReservaCliente).toISOString(),
        horasReservadas: horasNum,
        montoAcordado: montoNum,
      });
    } catch {
      setError('No se pudo crear la reserva.');
      setSubmitting(false);
    }
  };

  return (
    <div className="service-owner-dashboard__modal-overlay" role="dialog" aria-modal="true">
      <div className="service-owner-dashboard__modal">
        <div className="service-owner-dashboard__modal-header">
          <h2>Visita cumplida</h2>
          <button type="button" className="service-owner-dashboard__modal-close" onClick={onClose} disabled={submitting}>✕</button>
        </div>

        <div className="service-owner-dashboard__modal-body">
          <p><strong>Cliente:</strong> {visit.userNombre ?? 'Sin nombre'}</p>
          <p><strong>Fecha de visita:</strong> {visitDate ? dateFormatter.format(visitDate) : 'No disponible'}</p>

          {phase === 'options' && (
            <div className="service-owner-dashboard__modal-actions" style={{ flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="service-owner-dashboard__visit-action"
                onClick={() => setPhase('reservation-form')}
                disabled={submitting}
              >
                Crear reserva
              </button>
              <button
                type="button"
                className="service-owner-dashboard__visit-action"
                onClick={handleConfirmWithoutReservation}
                disabled={submitting}
              >
                Confirmar sin reserva
              </button>
              <button
                type="button"
                className="service-owner-dashboard__visit-action"
                onClick={handleReject}
                disabled={submitting}
              >
                Rechazar / eliminar visita
              </button>
            </div>
          )}

          {phase === 'reservation-form' && (
            <div className="service-owner-dashboard__modal-form" style={{ marginTop: '1rem' }}>
              <label className="service-owner-dashboard__modal-label">
                Fecha y hora de la reserva
                <input
                  type="datetime-local"
                  value={form.fechaReservaCliente}
                  onChange={(e) => setForm({ ...form, fechaReservaCliente: e.target.value })}
                  className="service-owner-dashboard__modal-input"
                />
              </label>
              <label className="service-owner-dashboard__modal-label">
                Monto acordado ($)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.montoAcordado}
                  onChange={(e) => setForm({ ...form, montoAcordado: e.target.value })}
                  placeholder="Ej: 15000"
                  className="service-owner-dashboard__modal-input"
                />
              </label>
              <label className="service-owner-dashboard__modal-label">
                Cantidad de horas
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={form.horasReservadas}
                  onChange={(e) => setForm({ ...form, horasReservadas: e.target.value })}
                  placeholder="Ej: 3"
                  className="service-owner-dashboard__modal-input"
                />
              </label>
              {error && <p className="service-owner-dashboard__modal-error" role="alert">{error}</p>}
              <div className="service-owner-dashboard__modal-actions">
                <button
                  type="button"
                  className="service-owner-dashboard__visit-action"
                  onClick={handleSubmitReservation}
                  disabled={submitting}
                >
                  {submitting ? 'Creando...' : 'Crear reserva'}
                </button>
                <button
                  type="button"
                  className="service-owner-dashboard__visit-action"
                  onClick={() => { setPhase('options'); setError(null); }}
                  disabled={submitting}
                >
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ConfirmReservationModalProps {
  reservation: ReservationDto;
  onClose: () => void;
  onConfirm: (horasReservadas: number, montoAcordado: number) => Promise<void>;
}

const ConfirmReservationModal = ({ reservation, onClose, onConfirm }: ConfirmReservationModalProps) => {
  const [horas, setHoras] = useState('');
  const [monto, setMonto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reservationDate = parseReservationDate(reservation.fechaReservaCliente);

  const handleSubmit = async () => {
    const horasNum = Number(horas);
    const montoNum = Number(monto);
    if (!horas || horasNum < 0.5) {
      setError('Las horas reservadas deben ser al menos 0.5.');
      return;
    }
    if (horasNum > 24) {
      setError('Las horas reservadas no pueden superar las 24.');
      return;
    }
    if (!monto || montoNum <= 0) {
      setError('El monto acordado debe ser mayor a cero.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(horasNum, montoNum);
    } catch {
      setError('No se pudo confirmar. Puede haber un conflicto de horarios.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="service-owner-dashboard__modal-overlay" role="dialog" aria-modal="true">
      <div className="service-owner-dashboard__modal">
        <div className="service-owner-dashboard__modal-header">
          <h2>Confirmar reserva</h2>
          <button type="button" className="service-owner-dashboard__modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="service-owner-dashboard__modal-body">
          <p><strong>Cliente:</strong> {reservation.usuario?.nombre ?? 'Sin nombre'}</p>
          <p><strong>Fecha:</strong> {reservationDate ? dateFormatter.format(reservationDate) : 'No disponible'}</p>
          <p><strong>Hora:</strong> {reservationDate ? timeFormatter.format(reservationDate) : 'No disponible'}</p>

          <div className="service-owner-dashboard__modal-form">
            <label className="service-owner-dashboard__modal-label">
              Horas reservadas
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                placeholder="Ej: 4"
                className="service-owner-dashboard__modal-input"
              />
            </label>
            <label className="service-owner-dashboard__modal-label">
              Monto acordado ($)
              <input
                type="number"
                min="0"
                step="1"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Ej: 15000"
                className="service-owner-dashboard__modal-input"
              />
            </label>
          </div>

          {error && <p className="service-owner-dashboard__modal-error" role="alert">{error}</p>}
        </div>

        <div className="service-owner-dashboard__modal-actions">
          <button
            type="button"
            className="service-owner-dashboard__visit-action"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Confirmando...' : 'Confirmar reserva'}
          </button>
          <button
            type="button"
            className="service-owner-dashboard__visit-action"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

interface AsociarServicioModalProps {
  salonId: string;
  vendorId: string;
  asociados: ServicioAsociadoDto[];
  onClose: () => void;
  onAsociado: () => Promise<void>;
}

const AsociarServicioModal = ({ salonId, vendorId, asociados, onClose, onAsociado }: AsociarServicioModalProps) => {
  const navigate = useNavigate();
  const [vendorServices, setVendorServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const services = await getServicesByVendorId(vendorId);
        setVendorServices(services);
      } catch {
        setError('No se pudieron cargar los servicios.');
      } finally {
        setLoadingServices(false);
      }
    };
    load();
  }, [vendorId]);

  const asociadosIds = new Set(asociados.map((a) => a.id));
  const disponibles = vendorServices.filter(
    (s) => s.id !== salonId && !asociadosIds.has(s.id) && !isSalonType(s.tipoServicio),
  );

  const handleAsociar = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await asociarServicio(salonId, selectedId);
      await onAsociado();
      onClose();
    } catch {
      setError('No se pudo asociar el servicio.');
      setSubmitting(false);
    }
  };

  return (
    <div className="service-owner-dashboard__modal-overlay" role="dialog" aria-modal="true">
      <div className="service-owner-dashboard__modal">
        <div className="service-owner-dashboard__modal-header">
          <h2>Asociar servicio al salón</h2>
          <button type="button" className="service-owner-dashboard__modal-close" onClick={onClose} disabled={submitting}>
            ✕
          </button>
        </div>

        <div className="service-owner-dashboard__modal-body">
          {loadingServices && <p>Cargando servicios...</p>}
          {!loadingServices && !error && disponibles.length === 0 && (
            <p>No tenés servicios disponibles para asociar. Podés crear uno nuevo.</p>
          )}
          {!loadingServices && disponibles.length > 0 && (
            <div className="service-owner-dashboard__asociar-list">
              {disponibles.map((s) => (
                <label key={s.id} className="service-owner-dashboard__asociar-item">
                  <input
                    type="radio"
                    name="servicio-asociar"
                    value={s.id}
                    checked={selectedId === s.id}
                    onChange={() => setSelectedId(s.id)}
                  />
                  <span>
                    <strong>{s.nombre}</strong>
                    {' — '}
                    <span>{s.tipoServicio}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {error && (
            <p className="service-owner-dashboard__modal-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="service-owner-dashboard__modal-actions">
          <button
            type="button"
            className="service-owner-dashboard__visit-action"
            onClick={handleAsociar}
            disabled={!selectedId || submitting || loadingServices}
          >
            {submitting ? 'Asociando...' : 'Asociar'}
          </button>
          <button
            type="button"
            className="service-owner-dashboard__visit-action"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
        </div>

        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <p style={{ fontSize: '0.875rem', opacity: 0.75 }}>
            ¿No tenés el servicio aún?{' '}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: 'inherit',
                color: 'inherit',
              }}
              onClick={() => navigate('/services/register')}
            >
              Crear nuevo servicio
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const ServiceOwnerDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const serviceFromState = (location.state as { service?: Service } | null | undefined)?.service;
  const [service, setService] = useState<Service | null>(serviceFromState ?? null);
  const [loading, setLoading] = useState(!serviceFromState);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<DashboardView>('calendario');
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectionTouched, setSelectionTouched] = useState(false);
  const [confirmModalReservation, setConfirmModalReservation] = useState<ReservationDto | null>(null);
  const [detailReservation, setDetailReservation] = useState<ReservationDto | null>(null);
  const [detailVisit, setDetailVisit] = useState<VisitDto | null>(null);
  const [listTab, setListTab] = useState<'visitas' | 'reservas'>('visitas');
  const [confirmVisitModalVisit, setConfirmVisitModalVisit] = useState<VisitDto | null>(null);
  const [asociarModalOpen, setAsociarModalOpen] = useState(false);

  useEffect(() => {
    const loadService = async () => {
      if (!id) {
        if (serviceFromState) {
          setService(serviceFromState);
          setError(null);
          setLoading(false);
          return;
        }

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

  const visits = useMemo(() => sortVisits(service?.visitas ?? []), [service]);
  const reservations = useMemo(() => sortReservations(service?.reservas ?? []), [service]);
  const filteredReservations = useMemo(() => {
    const visitIds = new Set(visits.map((visit) => visit.id));
    return reservations.filter((reservation) => !visitIds.has(reservation.id));
  }, [reservations, visits]);
  const visitsByDay = useMemo(() => groupVisitsByDay(visits), [visits]);
  const reservationsByDay = useMemo(() => groupReservationsByDay(filteredReservations), [filteredReservations]);
  const firstVisitKey = useMemo(() => {
    const firstVisit = visits[0];
    const parsedDate = firstVisit ? parseReservationDate(firstVisit.fechaHoraSolicitada) : null;
    return parsedDate ? getDateKey(parsedDate) : null;
  }, [visits]);
  const firstReservationKey = useMemo(() => {
    const firstReservation = filteredReservations[0];
    const parsedDate = firstReservation ? parseReservationDate(firstReservation.fechaReservaCliente) : null;
    return parsedDate ? getDateKey(parsedDate) : null;
  }, [filteredReservations]);
  const activeSelectedDayKey = selectionTouched ? selectedDayKey : (firstVisitKey ?? firstReservationKey);
  const selectedDayVisits = activeSelectedDayKey ? (visitsByDay[activeSelectedDayKey] ?? []) : [];
  const selectedDayReservations = activeSelectedDayKey ? (reservationsByDay[activeSelectedDayKey] ?? []) : [];
  const selectedDayDateSource = selectedDayVisits[0]?.fechaHoraSolicitada || selectedDayReservations[0]?.fechaReservaCliente || '';
  const selectedDayDate = activeSelectedDayKey ? parseReservationDate(selectedDayDateSource) : null;

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

  const metrics = useMemo<MetricCard[]>(() => {
    const pendingVisits = visits.filter((visit) => visit.estado.toLowerCase() === 'pendiente');
    const confirmedUnpaidReservations = filteredReservations.filter(
      (r) => r.confirmada && (r.montoAcordado ?? 0) > 0 && !isReservacionPagada(r),
    );
    const paidReservations = filteredReservations.filter((r) => r.confirmada && isReservacionPagada(r));
    const totalPagos = filteredReservations
      .flatMap((r) => r.pagos ?? [])
      .reduce((sum, p) => sum + p.importe, 0);

    return [
      { label: 'Visitas pendientes', value: String(pendingVisits.length), tone: 'is-warning', icon: '▣' },
      { label: 'Reservas confirmadas', value: String(confirmedUnpaidReservations.length), tone: 'is-info', icon: '$' },
      { label: 'Reservas pagadas', value: String(paidReservations.length), tone: 'is-success', icon: '✓' },
      { label: 'Pagos registrados', value: `$ ${currencyFormatter.format(totalPagos)}`, tone: 'is-purple', icon: '⇢' },
    ];
  }, [filteredReservations, visits]);

  const detailReservationId = detailReservation?.id;
  useEffect(() => {
    if (!detailReservationId || !service) return;
    const updated = service.reservas?.find((r) => r.id === detailReservationId);
    if (updated) setDetailReservation(updated);
  }, [service, detailReservationId]);

  const handleBack = () => {
    navigate('/vendor/dashboard');
  };

  const handleEdit = () => {
    if (!service) {
      return;
    }

    navigate(`/services/${service.id}/edit`);
  };

  const handleViewClientDetail = () => {
    if (!service) {
      return;
    }

    navigate(`/services/${service.id}`);
  };

  const refreshService = async () => {
    const serviceId = id ?? service?.id;
    if (!serviceId) {
      return;
    }

    const refreshedService = await getServiceById(serviceId);
    setService(refreshedService);
  };

  const handleConfirmVisit = (visit: VisitDto) => {
    if (!canCompleteVisit(visit)) {
      setError('Solo podés marcar como cumplida una visita cuando ya pasó su fecha y hora.');
      return;
    }
    setConfirmVisitModalVisit(visit);
  };

  const handleConfirmVisitWithReservation = async (data: { fechaReservaCliente: string; horasReservadas: number; montoAcordado: number }) => {
    if (!confirmVisitModalVisit) return;
    try {
      await confirmVisitAndMaybeCreateReservation(confirmVisitModalVisit.id, true, data);
      await refreshService();
      setError(null);
    } catch (error) {
      console.error('Error confirmando visita con reserva', error);
      setError('No se pudo confirmar la visita.');
    } finally {
      setConfirmVisitModalVisit(null);
    }
  };

  const handleConfirmVisitWithoutReservation = async () => {
    if (!confirmVisitModalVisit) return;
    try {
      await confirmVisitAndMaybeCreateReservation(confirmVisitModalVisit.id, false);
      await refreshService();
      setError(null);
    } catch (error) {
      console.error('Error confirmando visita sin reserva', error);
      setError('No se pudo confirmar la visita.');
    } finally {
      setConfirmVisitModalVisit(null);
    }
  };

  const handleRejectVisitFromModal = async () => {
    if (!confirmVisitModalVisit) return;
    try {
      await rejectVisit(confirmVisitModalVisit.id);
      await refreshService();
      setError(null);
    } catch (error) {
      console.error('Error rechazando visita desde modal', error);
      setError('No se pudo rechazar la visita.');
    } finally {
      setConfirmVisitModalVisit(null);
    }
  };

  const handleRejectVisit = async (visit: VisitDto) => {
    const confirmed = globalThis.confirm('¿Seguro que querés rechazar/eliminar esta visita?');
    if (!confirmed) {
      return;
    }

    try {
      await rejectVisit(visit.id);
      await refreshService();
      setError(null);
    } catch (visitError) {
      console.error('Error rechazando visita', visitError);
      setError('No se pudo rechazar la visita.');
    }
  };

  const handleConfirmReservation = (reservation: ReservationDto) => {
    setConfirmModalReservation(reservation);
  };

  const handleSubmitConfirmReservation = async (horasReservadas: number, montoAcordado: number) => {
    if (!confirmModalReservation) return;
    try {
      await confirmReservation(confirmModalReservation.id, { horasReservadas, montoAcordado });
      setConfirmModalReservation(null);
      await refreshService();
      setError(null);
    } catch (reservationError) {
      console.error('Error confirmando reserva', reservationError);
      setError('No se pudo confirmar la reserva. Puede haber un conflicto de horarios.');
    }
  };

  const handleRejectReservation = async (reservation: ReservationDto) => {
    const confirmed = globalThis.confirm('¿Seguro que querés rechazar esta reserva?');
    if (!confirmed) {
      return;
    }

    try {
      await rejectReservation(reservation.id);
      await refreshService();
      setError(null);
    } catch (reservationError) {
      console.error('Error rechazando reserva', reservationError);
      setError('No se pudo rechazar la reserva.');
    }
  };

  const handleViewReservationDetail = (reservation: ReservationDto) => {
    setDetailReservation(reservation);
  };

  const handleViewVisitDetail = (visit: VisitDto) => {
    setDetailVisit(visit);
  };

  const handleQuitarAsociacion = async (serviceId: string) => {
    const confirmed = globalThis.confirm('¿Querés quitar la asociación de este servicio?');
    if (!confirmed) return;
    try {
      await quitarServicioAsociado(service!.id, serviceId);
      await refreshService();
    } catch {
      setError('No se pudo quitar la asociación.');
    }
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

  let selectedDayLabel = 'Seleccioná un día';
  if (selectedDayDate) {
    selectedDayLabel = capitalizeText(dayLabelFormatter.format(selectedDayDate));
  }
  const dayVisitsCount = selectedDayVisits.length;
  const confirmedCount = selectedDayVisits.filter((visit) => visit.estado.toLowerCase() === 'confirmada').length;
  const pendingCount = dayVisitsCount - confirmedCount;
  const selectedDayReservationsCount = selectedDayReservations.length;
  const reservationWord = selectedDayReservationsCount === 1 ? 'reserva' : 'reservas';

  let selectedDaySummary = 'No hay visitas ni reservas para este día.';
  if (dayVisitsCount > 0 || selectedDayReservationsCount > 0) {
    selectedDaySummary = `${buildVisitDaySummary(dayVisitsCount, pendingCount, confirmedCount)} ${selectedDayReservationsCount} ${reservationWord} en este día.`;
  }

  return (
    <div className="service-owner-dashboard">
      <section className="service-owner-dashboard__hero">
        <div className="app-shell service-owner-dashboard__shell">
          <ServiceOwnerHeader
            service={service}
            reservationCount={filteredReservations.length}
            onBack={handleBack}
            onEdit={handleEdit}
            onViewClientDetail={handleViewClientDetail}
          />

          <ServiceOwnerMetrics metrics={metrics} />

          {isSalonType(service.tipoServicio) && (
            <section className="service-owner-dashboard__asociados">
              <div className="service-owner-dashboard__services-header">
                <div>
                  <h2>Servicios asociados al salón</h2>
                  <p>
                    {(service.serviciosAsociados?.length ?? 0) === 0
                      ? 'No hay servicios asociados todavía.'
                      : `${service.serviciosAsociados!.length} servicio${service.serviciosAsociados!.length === 1 ? '' : 's'} asociado${service.serviciosAsociados!.length === 1 ? '' : 's'}.`}
                  </p>
                </div>
                <button
                  type="button"
                  className="vendor-dashboard__create-button"
                  onClick={() => setAsociarModalOpen(true)}
                >
                  Asociar servicio
                </button>
              </div>

              {(service.serviciosAsociados?.length ?? 0) > 0 && (
                <div className="vendor-services-list" aria-label="Servicios asociados al salón">
                  {service.serviciosAsociados!.map((s) => (
                    <article key={s.id} className="service-admin-card">
                      <div className="service-admin-card__main">
                        <div className="service-admin-card__headline">
                          <span className="service-admin-card__eyebrow">{s.tipoServicio}</span>
                          <h3>{s.nombre}</h3>
                        </div>
                        <p className="service-admin-card__description">{s.descripcion}</p>
                        <div className="service-admin-card__meta">
                          <span>💲 Desde $ {currencyFormatter.format(s.precioMinimo)}</span>
                        </div>
                      </div>
                      <div className="service-admin-card__actions">
                        <button
                          type="button"
                          className="service-admin-card__action service-admin-card__action--danger"
                          onClick={() => handleQuitarAsociacion(s.id)}
                        >
                          Quitar asociación
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="service-owner-dashboard__content">
            <div className="service-owner-dashboard__switcher" role="tablist" aria-label="Vista de visitas del servicio">
              <button type="button" className={view === 'calendario' ? 'is-active' : ''} onClick={() => { setView('calendario'); setListTab('visitas'); }}>
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
                visitsByDay={visitsByDay}
                reservationsByDay={reservationsByDay}
                activeSelectedDayKey={activeSelectedDayKey}
                selectedDayLabel={selectedDayLabel}
                selectedDaySummary={selectedDaySummary}
                selectedDayVisits={selectedDayVisits}
                selectedDayReservations={selectedDayReservations}
                onPreviousMonth={() => setViewMonth((current) => addMonths(current, -1))}
                onNextMonth={() => setViewMonth((current) => addMonths(current, 1))}
                onToday={() => setViewMonth(startOfMonth(new Date()))}
                onSelectDay={handleSelectDay}
                onClearDay={handleClearDay}
                onConfirmVisit={handleConfirmVisit}
                onRejectVisit={handleRejectVisit}
                onViewVisitDetail={handleViewVisitDetail}
                onConfirmReservation={handleConfirmReservation}
                onRejectReservation={handleRejectReservation}
                onViewReservationDetail={handleViewReservationDetail}
              />
            ) : (
              <ServiceOwnerListView
                activeTab={listTab}
                onTabChange={setListTab}
                visits={visits}
                reservations={filteredReservations}
                onConfirmVisit={handleConfirmVisit}
                onRejectVisit={handleRejectVisit}
                onViewVisitDetail={handleViewVisitDetail}
                onConfirmReservation={handleConfirmReservation}
                onRejectReservation={handleRejectReservation}
                onViewReservationDetail={handleViewReservationDetail}
              />
            )}
          </section>
        </div>
      </section>

      {confirmModalReservation && (
        <ConfirmReservationModal
          reservation={confirmModalReservation}
          onClose={() => setConfirmModalReservation(null)}
          onConfirm={handleSubmitConfirmReservation}
        />
      )}

      {detailReservation && (
        <ReservationDetailModal
          reservation={detailReservation}
          onClose={() => setDetailReservation(null)}
          onDataChange={refreshService}
        />
      )}

      {detailVisit && (
        <VisitDetailModal
          visit={detailVisit}
          onClose={() => setDetailVisit(null)}
          onConfirmVisit={handleConfirmVisit}
          onRejectVisit={() => handleRejectVisit(detailVisit)}
        />
      )}

      {confirmVisitModalVisit && (
        <ConfirmVisitModal
          visit={confirmVisitModalVisit}
          onClose={() => setConfirmVisitModalVisit(null)}
          onConfirmWithReservation={handleConfirmVisitWithReservation}
          onConfirmWithoutReservation={handleConfirmVisitWithoutReservation}
          onReject={handleRejectVisitFromModal}
        />
      )}

      {asociarModalOpen && (
        <AsociarServicioModal
          salonId={service.id}
          vendorId={service.vendorId}
          asociados={service.serviciosAsociados ?? []}
          onClose={() => setAsociarModalOpen(false)}
          onAsociado={refreshService}
        />
      )}
    </div>
  );
};

export default ServiceOwnerDashboardPage;
