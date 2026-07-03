import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fechaHoraSolicitada, setFechaHoraSolicitada] = useState<Date | null>(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const loadService = async () => {
      if (!id) {
        setLoadError('No se encontró el servicio solicitado.');
        setLoading(false);
        return;
      }

      try {
        const foundService = await getServiceById(id);
        setService(foundService);
      } catch {
        setLoadError('No se pudo cargar el servicio.');
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

      toast.success(successMessage);
      navigate(`/services/${id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'No se pudo crear la reserva.';
      toast.error(message);
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

  if (loadError) {
    return (
      <div className="auth-container">
        <div className="auth-card auth-card--wide">
          <h1>Reservas</h1>
          <div className="auth-error">{loadError}</div>
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
