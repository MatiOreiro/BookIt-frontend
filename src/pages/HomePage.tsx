import { useEffect, useMemo, useState } from 'react';
import { navigate } from '../utils/navigation';
import { getEventCategories, type CatalogOption } from '../services/catalogService';
import { getBarriosByDepartamento, getDepartamentos, type BarrioOption, type DepartamentoOption } from '../services/geographyService';

const HomePage = () => {
  const [eventDate, setEventDate] = useState('');
  const [eventCategoryId, setEventCategoryId] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [barrioId, setBarrioId] = useState('');
  const [guests, setGuests] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);
  const [barrios, setBarrios] = useState<BarrioOption[]>([]);

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
      if (!departamentoId) {
        setBarrios([]);
        setBarrioId('');
        return;
      }

      const data = await getBarriosByDepartamento(departamentoId);
      setBarrios(data);
    };

    loadBarrios();
  }, [departamentoId]);

  const filters = useMemo(
    () => [
      { label: 'Fecha del evento', value: eventDate || 'Elegí una fecha' },
      { label: 'Tipo de evento', value: categories.find((category) => category.id === eventCategoryId)?.name || '' },
      { label: 'Departamento', value: departamentos.find((departamento) => departamento.id === departamentoId)?.nombre || '' },
      { label: 'Barrio', value: barrios.find((barrio) => barrio.id === barrioId)?.nombre || '' },
      { label: 'Invitados', value: guests },
    ],
    [categories, eventCategoryId, departamentos, departamentoId, barrios, barrioId, guests],
  );

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const params = new URLSearchParams();
    if (eventDate) params.set('date', eventDate);
    if (eventCategoryId) params.set('category', eventCategoryId);
    if (departamentoId) params.set('department', departamentoId);
    if (barrioId) params.set('barrio', barrioId);
    if (guests) params.set('guests', guests);

    const query = params.toString();
    navigate('/lounges' + (query ? `?${query}` : ''));
  };

  return (
    <div className="home-page">
      <section className="hero-section" id="hero-search">
        <div className="hero-section__backdrop" aria-hidden="true" />
        <div className="hero-section__overlay" aria-hidden="true" />

        <div className="app-shell hero-section__content">
          <p className="hero-kicker">Tu próximo evento empieza acá</p>
          <h1>Reservá el salón perfecto para tu evento</h1>
          <p className="hero-subtitle">
            Encontrá el lugar ideal y todos los servicios que necesitás en un solo lugar.
          </p>

          <form className="search-card" onSubmit={handleSubmit}>
            <div className="search-card__grid">
              <label className="search-field">
                <span>Fecha del evento</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </label>

              <label className="search-field">
                <span>Tipo de evento</span>
                <select value={eventCategoryId} onChange={(e) => setEventCategoryId(e.target.value)}>
                  <option value="">Seleccionar tipo</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="search-field">
                <span>Departamento</span>
                <select value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
                  <option value="">Seleccionar departamento</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.id} value={departamento.id}>
                      {departamento.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="search-field">
                <span>Barrio</span>
                <select value={barrioId} onChange={(e) => setBarrioId(e.target.value)} disabled={!departamentoId}>
                  <option value="">Seleccionar barrio</option>
                  {barrios.map((barrio) => (
                    <option key={barrio.id} value={barrio.id}>
                      {barrio.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="search-field">
                <span>Invitados</span>
                <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                  <option value="">Seleccionar cantidad</option>
                  <option value="Hasta 50">Hasta 50</option>
                  <option value="50-100">50-100</option>
                  <option value="100-200">100-200</option>
                  <option value="200-300">200-300</option>
                  <option value="Más de 300">Más de 300</option>
                </select>
              </label>
            </div>

            <button type="submit" className="hero-search__button">
              Buscar salones
            </button>

            {submitted && (
              <output className="search-card__status" aria-live="polite">
                Búsqueda lista: {filters.map((filter) => `${filter.label}: ${filter.value}`).join(' · ')}
              </output>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
