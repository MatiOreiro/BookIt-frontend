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
