import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { createReserva, createVisita, getServiceById } from '../services/serviceService';
import type { Service } from '../types/service';

const buildDefaultDateTime = () => {
  const now = new Date();
  const nextSlot = new Date(now);
  const minutesToAdd = now.getMinutes() < 30 ? 30 - now.getMinutes() : 60 - now.getMinutes();
  nextSlot.setMinutes(now.getMinutes() + minutesToAdd, 0, 0);
  return nextSlot.toISOString().slice(0, 16);
};

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
  const [fechaHoraSolicitada, setFechaHoraSolicitada] = useState(buildDefaultDateTime());
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
    if (!service) {
      return '';
    }

    return `${service.nombre} - desde $ ${moneyFormatter.format(service.precioMinimo)}`;
  }, [service]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !service) {
      return;
    }

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
          FechaReservaCliente: new Date(fechaHoraSolicitada).toISOString(),
        });
      } else {
        await createVisita({
          ...payload,
          FechaHoraSolicitada: new Date(fechaHoraSolicitada).toISOString(),
        });
      }

      setSuccess(successMessage);
      setMensaje('');
      setFechaHoraSolicitada(buildDefaultDateTime());
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
        <p>{reservationSummary || (isReservation ? 'Solicitá una reserva para este servicio.' : 'Solicitá una visita para este servicio.')}</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <div className="service-detail__reservation-summary">
          <strong>{service?.nombre}</strong>
          <span>{service?.ubicacion || 'Ubicación no especificada'}</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fechaHoraSolicitada">Fecha y hora solicitada</label>
            <input
              id="fechaHoraSolicitada"
              type="datetime-local"
              step="1800"
              value={fechaHoraSolicitada}
              onChange={(event) => setFechaHoraSolicitada(event.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mensaje">Mensaje opcional</label>
            <textarea
              id="mensaje"
              value={mensaje}
              onChange={(event) => setMensaje(event.target.value)}
              placeholder={isReservation ? 'Contanos brevemente qué necesitás para la reserva.' : 'Contanos brevemente qué necesitás para la visita.'}
              rows={5}
              maxLength={500}
              disabled={submitting}
            />
            <span className="form-group__hint">{formHint}</span>
          </div>

          <div className="service-detail__cta-stack service-detail__cta-stack--form">
            <button type="submit" className="service-detail__cta service-detail__cta--primary" disabled={submitting}>
              {submitting ? 'Enviando...' : submitLabel}
            </button>
            <button type="button" className="service-detail__cta service-detail__cta--secondary" onClick={() => navigate(-1)} disabled={submitting}>
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceReservationPage;