import { useMemo, useState } from 'react';
import { navigate } from '../utils/navigation';

const HomePage = () => {
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('');
  const [zone, setZone] = useState('');
  const [guests, setGuests] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const filters = useMemo(
    () => [
      { label: 'Fecha del evento', value: eventDate || 'Elegí una fecha' },
      { label: 'Tipo de evento', value: eventType },
      { label: 'Zona', value: zone },
      { label: 'Invitados', value: guests },
    ],
    [eventDate, eventType, zone, guests],
  );

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const params = new URLSearchParams();
    if (eventDate) params.set('date', eventDate);
    if (eventType) params.set('category', eventType);
    if (zone) params.set('zone', zone);
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
                <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  <option value="">Seleccionar tipo</option>
                  <option value="Bodas">Bodas</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                  <option value="Corporativos">Corporativos</option>
                  <option value="Quince años">Quince años</option>
                  <option value="Eventos sociales">Eventos sociales</option>
                </select>
              </label>

              <label className="search-field">
                <span>Zona</span>
                <select value={zone} onChange={(e) => setZone(e.target.value)}>
                  <option value="">Seleccionar zona</option>
                  <option value="Pocitos">Pocitos</option>
                  <option value="Carrasco">Carrasco</option>
                  <option value="Centro">Centro</option>
                  <option value="Parque Rodó">Parque Rodó</option>
                  <option value="Ciudad Vieja">Ciudad Vieja</option>
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
