import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { deleteService, getServices } from '../services/serviceService';
import type { Service } from '../types/service';

const currencyFormatter = new Intl.NumberFormat('es-UY');

const VendorDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const metrics = [
    { label: 'Pre-reservas', value: '0', tone: 'is-warning', icon: '▣' },
    { label: 'Reservas confirmadas', value: '0', tone: 'is-success', icon: '▣' },
    { label: 'Ingresos generales', value: '$ 0', tone: 'is-info', icon: '$' },
    { label: 'Ingresos potenciales', value: '$ 0', tone: 'is-purple', icon: '⇢' },
  ];

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
                        onClick={() => navigate(`/vendor/services/${service.id}`, { state: { service } })}
                      >
                        Ver detalles
                      </button>
                      <button
                        type="button"
                        className="service-admin-card__action"
                        onClick={() => navigate(`/services/${service.id}/edit`)}
                      >
                        Modificar
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