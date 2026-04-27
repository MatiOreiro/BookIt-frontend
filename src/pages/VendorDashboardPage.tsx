import { useState } from 'react';

type DashboardView = 'lista' | 'calendario';

const VendorDashboardPage = () => {
  const [view, setView] = useState<DashboardView>('lista');

  const metrics = [
    { label: 'Pre-reservas', value: '0', tone: 'is-warning', icon: '▣' },
    { label: 'Reservas confirmadas', value: '0', tone: 'is-success', icon: '▣' },
    { label: 'Citas pendientes', value: '0', tone: 'is-info', icon: '◔' },
    { label: 'Ingresos confirmados', value: '$ 0', tone: 'is-purple', icon: '$' },
  ];

  return (
    <div className="vendor-dashboard">
      <section className="vendor-dashboard__hero">
        <div className="app-shell">
          <p className="vendor-dashboard__eyebrow">Panel de dueño</p>
          <h1>Panel de Control - Crystal Palace</h1>
          <p className="vendor-dashboard__subtitle">Gestioná tus reservas y citas.</p>

          <div className="vendor-metrics">
            {metrics.map((metric) => (
              <article key={metric.label} className="vendor-metric-card">
                <span className={`vendor-metric-card__icon ${metric.tone}`}>{metric.icon}</span>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>

          <div className="vendor-dashboard__switcher" role="tablist" aria-label="Vista del dashboard">
            <button
              type="button"
              className={view === 'calendario' ? 'is-active' : ''}
              onClick={() => setView('calendario')}
            >
              Calendario
            </button>
            <button
              type="button"
              className={view === 'lista' ? 'is-active' : ''}
              onClick={() => setView('lista')}
            >
              Lista
            </button>
          </div>

          <div className="vendor-dashboard__list" aria-label="Reservas del salón">
            <article className="booking-card booking-card--empty">
              <div className="booking-card__main">
                <div className="booking-card__headline">
                  <h2>Sin reservas cargadas todavía</h2>
                  <span className="booking-badge booking-badge--neutral">
                    {view === 'calendario' ? 'Calendario vacío' : 'Lista vacía'}
                  </span>
                </div>

                <div className="booking-card__meta">
                  <span>👤 Sin datos</span>
                  <span>🗓 Sin eventos programados</span>
                </div>

                <div className="booking-card__details">
                  <span>🕒 --:--</span>
                  <span>👥 0 invitados</span>
                  <span>💲 $ 0</span>
                </div>
              </div>

              <button type="button" className="booking-card__action" disabled>
                Ver detalle
              </button>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VendorDashboardPage;