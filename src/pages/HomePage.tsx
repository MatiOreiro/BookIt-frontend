import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

const HomePage = () => {
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('Bodas');
  const [zone, setZone] = useState('Pocitos');
  const [guests, setGuests] = useState('50-100');
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
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
                  <option>Bodas</option>
                  <option>Cumpleaños</option>
                  <option>Corporativos</option>
                  <option>Quince años</option>
                  <option>Eventos sociales</option>
                </select>
              </label>

              <label className="search-field">
                <span>Zona</span>
                <select value={zone} onChange={(e) => setZone(e.target.value)}>
                  <option>Pocitos</option>
                  <option>Carrasco</option>
                  <option>Centro</option>
                  <option>Parque Rodó</option>
                  <option>Ciudad Vieja</option>
                </select>
              </label>

              <label className="search-field">
                <span>Invitados</span>
                <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                  <option>Hasta 50</option>
                  <option>50-100</option>
                  <option>100-200</option>
                  <option>200-300</option>
                  <option>Más de 300</option>
                </select>
              </label>
            </div>

            <button type="submit" className="hero-search__button">
              Buscar salones
            </button>

            {submitted && (
              <p className="search-card__status" role="status">
                Búsqueda lista: {filters.map((filter) => `${filter.label}: ${filter.value}`).join(' · ')}
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
