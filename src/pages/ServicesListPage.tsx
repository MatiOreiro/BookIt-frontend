import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getServices } from '../services/serviceService';
import { getEventCategories, type CatalogOption } from '../services/catalogService';
import { getBarriosByDepartamento, getDepartamentos, type BarrioOption, type DepartamentoOption } from '../services/geographyService';
import type { Service } from '../types/service';

const normalizeType = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const matchesMode = (serviceType: string, isServicesMode: boolean) => {
  const normalized = normalizeType(serviceType);
  return isServicesMode
    ? normalized.includes('servicio')
    : normalized.includes('salon');
};

const matchesCategoryFilter = (service: Service, categoryId?: string) => {
  if (!categoryId) return true;
  return service.categorias?.some((category) => category.id === categoryId) ?? false;
};

const matchesDepartmentFilter = (service: Service, departamentoId?: string) => {
  if (!departamentoId) return true;
  return service.direccion?.departamento?.id === departamentoId;
};

const matchesBarrioFilter = (service: Service, barrioId?: string) => {
  if (!barrioId) return true;
  return service.direccion?.barrio?.id === barrioId;
};

const matchesGuestsFilter = (service: Service, guests?: string) => {
  if (!guests) return true;
  const capacity = service.capacidad;
  if (capacity == null) return false;

  switch (guests) {
    case 'Hasta 50':
      return capacity <= 50;
    case '50-100':
      return capacity >= 50 && capacity <= 100;
    case '100-200':
      return capacity >= 100 && capacity <= 200;
    case '200-300':
      return capacity >= 200 && capacity <= 300;
    case 'Más de 300':
      return capacity > 300;
    default:
      return true;
  }
};

const ServicesListPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);
  const [barrios, setBarrios] = useState<BarrioOption[]>([]);

  const isServicesMode = location.pathname.startsWith('/services');
  const initialDepartment = searchParams.get('department') || searchParams.get('zone') || '';
  const initialBarrio = searchParams.get('barrio') || '';

  // Filter state (temp - pending application)
  const [eventTypeFilter, setEventTypeFilter] = useState(searchParams.get('category') || '');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [departamentoFilter, setDepartamentoFilter] = useState(initialDepartment);
  const [barrioFilter, setBarrioFilter] = useState(initialBarrio);
  const [invitadosFilter, setInvitadosFilter] = useState(searchParams.get('guests') || '');

  // Applied filters (what's actually being used for search)
  const [appliedFilters, setAppliedFilters] = useState({
    categoryId: searchParams.get('category') || '',
    minPrice: undefined,
    maxPrice: undefined,
    departamentoId: initialDepartment,
    barrioId: initialBarrio,
    guests: searchParams.get('guests') || '',
  });

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getEventCategories();
      setCategories(data);
    };

    const loadDepartamentos = async () => {
      const data = await getDepartamentos();
      setDepartamentos(data);
    };

    loadCategories();
    loadDepartamentos();
  }, []);

  useEffect(() => {
    const loadBarrios = async () => {
      if (!departamentoFilter) {
        setBarrios([]);
        setBarrioFilter('');
        return;
      }

      const data = await getBarriosByDepartamento(departamentoFilter);
      setBarrios(data);
    };

    loadBarrios();
  }, [departamentoFilter]);

  const getServiceLocation = (service: Service) => {
    const departmentName = service.direccion?.departamento?.nombre;
    const barrioName = service.direccion?.barrio?.nombre;

    if (departmentName || barrioName) {
      return [departmentName, barrioName].filter(Boolean).join(' / ');
    }

    return service.ubicacion || 'Ubicación no especificada';
  };

  const fetchFilters = useMemo(() => ({
    minPrice: appliedFilters.minPrice,
    maxPrice: appliedFilters.maxPrice,
    searchTerm: searchParams.get('q') || undefined,
  }), [appliedFilters.minPrice, appliedFilters.maxPrice, searchParams]);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters = fetchFilters;

        const data = await getServices(filters);
        const typedData = data.filter((service) =>
          matchesMode(service.tipoServicio, isServicesMode),
        );

        const filteredData = typedData.filter((service) =>
          matchesCategoryFilter(service, appliedFilters.categoryId)
          && matchesDepartmentFilter(service, appliedFilters.departamentoId)
          && matchesBarrioFilter(service, appliedFilters.barrioId)
          && matchesGuestsFilter(service, appliedFilters.guests),
        );

        setServices(filteredData);
      } catch {
        setError('Error al cargar los salones');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [fetchFilters, appliedFilters.categoryId, appliedFilters.departamentoId, appliedFilters.barrioId, appliedFilters.guests, isServicesMode]);

  const handleApplyFilters = () => {
    const minPrice = minPriceFilter ? Number.parseFloat(minPriceFilter) : undefined;
    const maxPrice = maxPriceFilter ? Number.parseFloat(maxPriceFilter) : undefined;

    setAppliedFilters({
      categoryId: eventTypeFilter,
      minPrice,
      maxPrice,
      departamentoId: departamentoFilter,
      barrioId: barrioFilter,
      guests: invitadosFilter,
    });
  };

  const handleClearFilters = () => {
    setEventTypeFilter('');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setDepartamentoFilter('');
    setBarrioFilter('');
    setInvitadosFilter('');
    setAppliedFilters({
      categoryId: '',
      minPrice: undefined,
      maxPrice: undefined,
      departamentoId: '',
      barrioId: '',
      guests: '',
    });
  };

  const activeFilters = [eventTypeFilter, minPriceFilter, maxPriceFilter, departamentoFilter, barrioFilter, invitadosFilter].filter(
    Boolean,
  ).length;
  const searchSuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const serviceLabel = isServicesMode ? 'servicio' : 'salón';
  const serviceLabelPlural = isServicesMode ? 'servicios' : 'salones';
  const serviceCountLabel = services.length === 1
    ? `1 ${serviceLabel} disponible`
    : `${services.length} ${serviceLabelPlural} disponibles`;

  return (
    <div className="services-page">
      <div className="services-page__header">
        <h1>{isServicesMode ? 'Servicios para eventos en Montevideo' : 'Salones para eventos en Montevideo'}</h1>
        <p className="services-page__subtitle">{serviceCountLabel}</p>
      </div>

      <div className="services-page__container">
        {/* Filtros Sidebar */}
        <aside className="services-filters">
          <div className="services-filters__header">
            <h2>Filtros</h2>
            {activeFilters > 0 && (
              <button className="services-filters__clear" onClick={handleClearFilters}>
                Limpiar
              </button>
            )}
          </div>

          <div className="filter-group">
            <label htmlFor="tipo-evento" className="filter-label">
              Tipo de evento
            </label>
            <select
              id="tipo-evento"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="departamento" className="filter-label">
              Departamento
            </label>
            <select
              id="departamento"
              value={departamentoFilter}
              onChange={(e) => setDepartamentoFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos</option>
              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="barrio" className="filter-label">
              Barrio
            </label>
            <select
              id="barrio"
              value={barrioFilter}
              onChange={(e) => setBarrioFilter(e.target.value)}
              className="filter-select"
              disabled={!departamentoFilter}
            >
              <option value="">Todos</option>
              {barrios.map((barrio) => (
                <option key={barrio.id} value={barrio.id}>
                  {barrio.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="invitados" className="filter-label">
              Cantidad de invitados
            </label>
            <select
              id="invitados"
              value={invitadosFilter}
              onChange={(e) => setInvitadosFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Cualquier cantidad</option>
              <option value="Hasta 50">Hasta 50</option>
              <option value="50-100">50-100</option>
              <option value="100-200">100-200</option>
              <option value="200-300">200-300</option>
              <option value="Más de 300">Más de 300</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="precio-minimo" className="filter-label">
              Rango de precio
            </label>
            <div className="price-inputs">
              <input
                id="precio-minimo"
                type="number"
                placeholder="Precio mínimo"
                value={minPriceFilter}
                onChange={(e) => setMinPriceFilter(e.target.value)}
                className="price-input"
                min="0"
              />
              <input
                type="number"
                placeholder="Precio máximo"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                className="price-input"
                min="0"
              />
            </div>
          </div>

          <div className="services-filters__footer">
            <button
              className="services-filters__apply"
              onClick={handleApplyFilters}
              disabled={loading}
            >
              Aplicar filtros
            </button>
          </div>
        </aside>

        {/* Resultados */}
        <main className="services-results">
          {loading && (
            <div className="services-empty">
              <p>Cargando salones...</p>
            </div>
          )}

          {error && (
            <div className="services-empty services-empty--error">
              <p role="alert">{error}</p>
            </div>
          )}

          {!loading && !error && services.length === 0 && (
            <div className="services-empty">
              <p>No se encontraron resultados con los filtros aplicados.</p>
              <button className="btn-primary" onClick={handleClearFilters}>
                Limpiar filtros
              </button>
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <div className="services-masonry">
              {services.map((service) => (
                <div key={service.id} className="service-card">
                  <div className="service-card__image">
                    {service.imagenes?.[0] ? (
                      <img src={service.imagenes[0]} alt={service.nombre} />
                    ) : (
                      <div className="service-card__placeholder">📷</div>
                    )}
                  </div>

                  <div className="service-card__content">
                    <h3 className="service-card__name">{service.nombre || 'Salón sin nombre'}</h3>

                    <div className="service-card__meta">
                      <span className="service-card__location">📍 {getServiceLocation(service)}</span>
                      <span className="service-card__capacity">
                        👥 {typeof service.capacidad === 'number' ? `${service.capacidad} personas` : 'Capacidad no disponible'}
                      </span>
                    </div>

                    {service.categorias && service.categorias.length > 0 && (
                      <div className="service-card__tags">
                        {service.categorias.slice(0, 3).map((cat) => (
                          <span key={cat.id} className="service-tag">
                            {cat.nombre}
                          </span>
                        ))}
                        {service.categorias.length > 3 && (
                          <span className="service-tag service-tag--more">
                            +{service.categorias.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="service-card__rating">
                      <span className="stars">⭐ {service.avgRating != null ? service.avgRating.toFixed(1) : '—'}</span>
                      <span className="reviews">({service.reviewCount ?? 0} reseñas)</span>
                    </div>

                    <div className="service-card__footer">
                      <div className="service-card__price">
                        <span className="price-label">desde</span>
                        <span className="price-value">${(service.precioMinimo ?? 0).toLocaleString()}</span>
                      </div>
                      <button
                        className="service-card__cta"
                        onClick={() => navigate(`${isServicesMode ? '/services' : '/lounges'}/${service.id}${searchSuffix}`, { state: { service } })}
                      >
                        Ver más
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ServicesListPage;
