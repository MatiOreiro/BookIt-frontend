import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getServices } from '../services/serviceService';
import type { Service } from '../types/service';

const ServicesListPage = () => {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state (temp - pending application)
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [zonaFilter, setZonaFilter] = useState(searchParams.get('zone') || '');
  const [invitadosFilter, setInvitadosFilter] = useState(searchParams.get('guests') || '');

  // Applied filters (what's actually being used for search)
  const [appliedFilters, setAppliedFilters] = useState({
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    location: (searchParams.get('zone') || '') as string,
    guests: (searchParams.get('guests') || '') as string,
  });

  // Extract unique locations for suggestions
  const uniqueLocations = useMemo(
    () => Array.from(new Set(services.map((s) => s.ubicacion).filter(Boolean))),
    [services],
  );

  // Fetch services when applied filters change
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters = {
          minPrice: appliedFilters.minPrice,
          maxPrice: appliedFilters.maxPrice,
          location: appliedFilters.location || undefined,
          searchTerm: searchParams.get('q') || undefined,
        };

        const data = await getServices(filters);
        
        // Filter by guests on client-side if guests filter is selected
        // In a real scenario, this would be server-side filtered
        // For now, we'll keep all results as capacity info isn't available
        // You might want to add capacity to the Service type later
        setServices(data);
      } catch {
        setError('Error al cargar los salones');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [appliedFilters, searchParams]);

  const handleApplyFilters = () => {
    const minPrice = minPriceFilter ? Number.parseFloat(minPriceFilter) : undefined;
    const maxPrice = maxPriceFilter ? Number.parseFloat(maxPriceFilter) : undefined;

    setAppliedFilters({
      minPrice,
      maxPrice,
      location: zonaFilter,
      guests: invitadosFilter,
    });
  };

  const handleClearFilters = () => {
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setZonaFilter('');
    setInvitadosFilter('');
    setAppliedFilters({
      minPrice: undefined,
      maxPrice: undefined,
      location: '',
      guests: '',
    });
  };

  const activeFilters = [minPriceFilter, maxPriceFilter, zonaFilter, invitadosFilter].filter(
    Boolean,
  ).length;

  return (
    <div className="services-page">
      <div className="services-page__header">
        <h1>Salones para eventos en Montevideo</h1>
        <p className="services-page__subtitle">{services.length} salón{services.length !== 1 ? 'es' : ''} disponible{services.length !== 1 ? 's' : ''}</p>
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
            <label htmlFor="zona" className="filter-label">
              Zona
            </label>
            <select
              id="zona"
              value={zonaFilter}
              onChange={(e) => setZonaFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas</option>
              <option value="Pocitos">Pocitos</option>
              <option value="Carrasco">Carrasco</option>
              <option value="Centro">Centro</option>
              <option value="Parque Rodó">Parque Rodó</option>
              <option value="Ciudad Vieja">Ciudad Vieja</option>
              {uniqueLocations
                .filter((loc) => !['Pocitos', 'Carrasco', 'Centro', 'Parque Rodó', 'Ciudad Vieja'].includes(loc))
                .map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
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
            <label className="filter-label">Rango de precio</label>
            <div className="price-inputs">
              <input
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
              <p>No se encontraron salones con los filtros aplicados.</p>
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
                    <div className="service-card__placeholder">📷</div>
                  </div>

                  <div className="service-card__content">
                    <h3 className="service-card__name">{service.nombre || 'Salón sin nombre'}</h3>

                    <div className="service-card__meta">
                      <span className="service-card__location">📍 {service.ubicacion || 'Ubicación no especificada'}</span>
                      <span className="service-card__capacity">👥 50-200 personas</span>
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
                      <span className="stars">⭐ 4.5</span>
                      <span className="reviews">(12 reseñas)</span>
                    </div>

                    <div className="service-card__footer">
                      <div className="service-card__price">
                        <span className="price-label">desde</span>
                        <span className="price-value">${(service.precioMinimo ?? 0).toLocaleString()}</span>
                      </div>
                      <button className="service-card__cta">Ver más</button>
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
