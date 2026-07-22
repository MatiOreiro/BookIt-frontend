import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterUserPage from '../pages/RegisterUserPage';
import RegisterServicePage from '../pages/RegisterServicePage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ProfilePage from '../pages/ProfilePage';
import VendorDashboardPage from '../pages/VendorDashboardPage';
import ServiceOwnerDashboardPage from '../pages/ServiceOwnerDashboardPage';
import ServiceReservationPage from '../pages/ServiceReservationPage';
import HomePage from '../pages/HomePage';
import ServicesListPage from '../pages/ServicesListPage';
import MisTramitesPage from '../pages/MisTramitesPage';
import { getServiceById } from '../services/serviceService';
import { getResenasByServiceId } from '../services/resenaService';
import type { ResenaDto, Service } from '../types/service';
import { setNavigate } from '../utils/navigation';
import AssistantChat from '../components/AssistantChat';

const currencyFormatter = new Intl.NumberFormat('es-UY');

const DIAS_NOMBRES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_ORDEN = [1, 2, 3, 4, 5, 6, 0];

const formatDias = (dias: number[] | null | undefined): string => {
  if (!dias || dias.length === 0 || dias.length === 7) return 'Todos los días';
  const sorted = [...dias].sort((a, b) => DIAS_ORDEN.indexOf(a) - DIAS_ORDEN.indexOf(b));
  return sorted.map((d) => DIAS_NOMBRES[d]).join(', ');
};

const formatHora = (hora: number | null | undefined, fallback: number): string =>
  `${String(hora ?? fallback).padStart(2, '0')}:00`;

const buildWhatsAppUrl = (phone?: string) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
};

const buildMapUrl = (service?: Service) => {
  const query = [service?.nombre, service?.ubicacion].filter(Boolean).join(', ');
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
};

const getServiceMainImage = (service?: Service) => service?.imagenes?.[0] ?? null;
const getServiceGalleryImages = (service?: Service) => service?.imagenes ?? [];

const reviewDateFormatter = new Intl.DateTimeFormat('es-UY', { dateStyle: 'long' });
const isVideoMediaUrl = (url: string) => /\/video\/upload\//.test(url) || /\.(mp4|mov|webm|ogg)$/i.test(url);

const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isServicesRoute = location.pathname.startsWith('/services/');
  const listPath = isServicesRoute ? '/services' : '/lounges';
  const serviceFromState = (location.state as { service?: Service } | null | undefined)?.service;
  const [service, setService] = useState<Service | null>(serviceFromState ?? null);
  const [loading, setLoading] = useState(!serviceFromState);
  const [error, setError] = useState<string | null>(null);
  const [resenas, setResenas] = useState<ResenaDto[]>([]);

  useEffect(() => {
    if (!id) {
      setError('No se encontró el servicio solicitado.');
      setLoading(false);
      return;
    }

    const fetchService = async () => {
      try {
        const foundService = await getServiceById(id);
        setService(foundService);
      } catch {
        if (!serviceFromState) {
          setError('No se pudo cargar el detalle del servicio.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id) return;

    const fetchResenas = async () => {
      try {
        const fetchedResenas = await getResenasByServiceId(id);
        setResenas(fetchedResenas);
      } catch {
        setResenas([]);
      }
    };

    fetchResenas();
  }, [id]);

  const mapUrl = useMemo(() => buildMapUrl(service ?? undefined), [service]);
  const whatsappUrl = useMemo(
    () => buildWhatsAppUrl(service?.vendor?.telefono),
    [service],
  );
  return (
    <div className="service-detail-page">
      <div className="service-detail-page__shell">
        <button type="button" className="service-detail-page__back" onClick={() => navigate(`${listPath}${location.search}`)}>
          ← Volver a resultados
        </button>

        {loading && (
          <div className="service-detail-page__state">
            <p>Cargando detalle del servicio...</p>
          </div>
        )}

        {!loading && error && (
          <div className="service-detail-page__state service-detail-page__state--error">
            <p role="alert">{error}</p>
            <button type="button" className="btn-primary" onClick={() => navigate(listPath)}>
              Volver al listado
            </button>
          </div>
        )}

        {!loading && !error && service && (
          <div className="service-detail">
            <section className="service-detail__hero">
              <div className="service-detail__gallery">
                {getServiceGalleryImages(service).length === 0 ? (
                  <div className="service-detail__gallery-empty service-detail__gallery-empty--full">
                    <span aria-hidden="true">📷</span>
                    <p>No tiene imágenes cargadas aún.</p>
                  </div>
                ) : (
                  <>
                    <div className="service-detail__main-image">
                      <img src={getServiceMainImage(service) ?? undefined} alt={service.nombre} />
                      <div className="service-detail__main-image-overlay">
                        <span className="service-detail__eyebrow">{service.tipoServicio || 'Salón para eventos'}</span>
                        <h1>{service.nombre}</h1>
                        <p>{service.ubicacion || 'Ubicación no especificada'}</p>
                      </div>
                    </div>

                    {getServiceGalleryImages(service).length > 1 && (
                      <div className="service-detail__thumbs" aria-label="Galería del servicio">
                        {getServiceGalleryImages(service)
                          .slice(1, 6)
                          .map((imageUrl, index) => (
                            <div key={imageUrl} className={`service-detail__thumb service-detail__thumb--${index + 1}`}>
                              <img src={imageUrl} alt={`${service.nombre} ${index + 2}`} />
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <aside className="service-detail__summary">
                <div className="service-detail__price-block">
                  <span className="service-detail__price-label">Precio desde</span>
                  <div className="service-detail__price">$ {currencyFormatter.format(service.precioMinimo)}</div>
                  {service.precioMaximo > service.precioMinimo && (
                    <p className="service-detail__price-range">
                      Hasta $ {currencyFormatter.format(service.precioMaximo)}
                    </p>
                  )}
                </div>

                {service.vendor?.nombre && (
                  <div className="service-detail__vendor">
                    <span className="service-detail__vendor-label">Atendido por</span>
                    <strong className="service-detail__vendor-name">{service.vendor.nombre}</strong>
                  </div>
                )}

                <div className="service-detail__schedule">
                  <span className="service-detail__schedule-label">Días de atención</span>
                  <span className="service-detail__schedule-value">{formatDias(service.diasAtencion)}</span>
                  <span className="service-detail__schedule-label">Horario reservas</span>
                  <span className="service-detail__schedule-value">
                    {formatHora(service.horaAperturaReserva, 8)} – {formatHora(service.horaCierreReserva, 22)}
                  </span>
                  <span className="service-detail__schedule-label">Horario visitas</span>
                  <span className="service-detail__schedule-value">
                    {formatHora(service.horaAperturaVisita, 8)} – {formatHora(service.horaCierreVisita, 22)}
                  </span>
                </div>

                <div className="service-detail__contact-list">
                  {service.vendor?.telefono && (
                    <a className="service-detail__contact-item" href={`tel:${service.vendor.telefono}`}>
                      <span>📞</span>
                      <span>{service.vendor.telefono}</span>
                    </a>
                  )}

                  {service.vendor?.email && (
                    <a className="service-detail__contact-item" href={`mailto:${service.vendor.email}`}>
                      <span>✉️</span>
                      <span>{service.vendor.email}</span>
                    </a>
                  )}
                </div>

                <div className="service-detail__cta-stack">
                  {whatsappUrl ? (
                    <a className="service-detail__cta service-detail__cta--whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
                      Consultar por WhatsApp
                    </a>
                  ) : (
                    <button type="button" className="service-detail__cta service-detail__cta--whatsapp" disabled>
                      Consultar por WhatsApp
                    </button>
                  )}

                  <button
                    type="button"
                    className="service-detail__cta service-detail__cta--primary"
                    onClick={() => navigate(`/services/${service.id}/agendar?tipo=visita`, { state: { service } })}
                  >
                    Agendar visita
                  </button>

                  <button
                    type="button"
                    className="service-detail__cta service-detail__cta--secondary"
                    onClick={() => navigate(`/services/${service.id}/agendar?tipo=reserva`, { state: { service } })}
                  >
                    Agendar reserva
                  </button>
                </div>

                <p className="service-detail__response-note">Respuesta en menos de 24 horas</p>
              </aside>
            </section>

            <section className="service-detail__content">
              <div className="service-detail__main">
                <div className="service-detail__section">
                  <h2>Sobre el salón</h2>
                  <p>{service.descripcion || 'Este servicio no tiene una descripción detallada cargada todavía.'}</p>
                </div>

                {service.serviciosAsociados && service.serviciosAsociados.length > 0 && (
                  <div className="service-detail__section">
                    <h2>Servicios disponibles en este salón</h2>
                    <div className="service-detail__asociados-grid">
                      {service.serviciosAsociados.map((s) => (
                        <div key={s.id} className="service-detail__asociado-card">
                          <span className="service-detail__asociado-tipo">{s.tipoServicio}</span>
                          <button
                            type="button"
                            className="service-detail__asociado-nombre"
                            onClick={() => navigate(`/services/${s.id}`)}
                          >
                            {s.nombre}
                          </button>
                          {s.descripcion && (
                            <p className="service-detail__asociado-desc">{s.descripcion}</p>
                          )}
                          <span className="service-detail__asociado-precio">
                            Desde $ {currencyFormatter.format(s.precioMinimo)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="service-detail__section">
                  <h2>Datos generales</h2>
                  <div className="service-detail__meta-grid">
                    <div className="service-detail__meta-item">
                      <span className="service-detail__meta-label">Tipo de servicio</span>
                      <span className="service-detail__meta-value">{service.tipoServicio || 'No especificado'}</span>
                    </div>
                    <div className="service-detail__meta-item">
                      <span className="service-detail__meta-label">Ubicación</span>
                      <span className="service-detail__meta-value">{service.ubicacion || 'No especificada'}</span>
                    </div>
                    <div className="service-detail__meta-item">
                      <span className="service-detail__meta-label">Proveedor</span>
                      <span className="service-detail__meta-value">{service.vendor?.nombre || 'Sin datos de proveedor'}</span>
                    </div>
                    <div className="service-detail__meta-item">
                      <span className="service-detail__meta-label">Estado</span>
                      <span className="service-detail__meta-value">{service.activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                </div>

                <div className="service-reviews">
                  <div className="service-reviews__header">
                    <h2>Reseñas</h2>
                    <span className="service-reviews__avg">
                      ⭐ {service.avgRating != null ? service.avgRating.toFixed(1) : '—'}
                    </span>
                    <span className="service-reviews__count">({service.reviewCount ?? 0} reseñas)</span>
                  </div>

                  {resenas.length === 0 ? (
                    <p className="service-reviews__empty">Todavía no hay reseñas para este servicio.</p>
                  ) : (
                    <div className="service-reviews__list">
                      {resenas.map((resena) => (
                        <article key={resena.id} className="service-review">
                          <div className="service-review__header">
                            <span className="service-review__author">{resena.usuarioNombre || 'Usuario'}</span>
                            <span className="service-review__stars">{'★'.repeat(resena.puntuacion)}{'☆'.repeat(5 - resena.puntuacion)}</span>
                          </div>
                          <p className="tramite-card__date">{reviewDateFormatter.format(new Date(resena.fechaCreacion))}</p>
                          {resena.comentario && <p className="service-review__comment">{resena.comentario}</p>}
                          {resena.mediaUrls.length > 0 && (
                            <div className="service-review__media">
                              {resena.mediaUrls.map((url) =>
                                isVideoMediaUrl(url) ? (
                                  <video key={url} src={url} controls className="service-review__media-item" />
                                ) : (
                                  <img key={url} src={url} alt="" className="service-review__media-item" />
                                ),
                              )}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="service-detail__map-card">
                <div className="service-detail__section-header">
                  <h2>Ubicación</h2>
                  <p>Vista en Google Maps</p>
                </div>

                <div className="service-detail__map-frame">
                  <iframe
                    title={`Mapa de ${service.nombre}`}
                    src={mapUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>

                <a className="service-detail__map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([service.nombre, service.ubicacion].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer">
                  Abrir en Google Maps
                </a>
              </aside>
            </section>
          </div>
        )}

        {!loading && !error && service && <AssistantChat serviceId={service.id} />}
      </div>
    </div>
  );
};

const NavigationRegistrar = () => {
  const nav = useNavigate();
  useEffect(() => {
    setNavigate(nav);
  }, [nav]);
  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <NavigationRegistrar />
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/register/user" replace />} />
          <Route path="/register/user" element={<RegisterUserPage />} />
          <Route path="/register/service" element={<Navigate to="/services/register" replace />} />
          <Route path="/lounges" element={<ServicesListPage />} />
          <Route path="/lounges/:id" element={<ServiceDetailPage />} />
          <Route path="/services" element={<ServicesListPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route
            path="/services/:id/agendar"
            element={
              <ProtectedRoute>
                <ServiceReservationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/:id/reservar"
            element={
              <ProtectedRoute>
                <ServiceReservationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-tramites"
            element={
              <ProtectedRoute>
                <MisTramitesPage />
              </ProtectedRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/services/register"
            element={
              <ProtectedRoute>
                <RegisterServicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['vendedor', 'vendor', 'salon']}>
                <RegisterServicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/services/:id"
            element={
              <ProtectedRoute allowedRoles={['vendedor', 'vendor', 'salon']}>
                <ServiceOwnerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['vendedor', 'vendor', 'salon']}>
                <VendorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
