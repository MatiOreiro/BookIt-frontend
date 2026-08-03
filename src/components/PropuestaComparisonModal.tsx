import type { PropuestaDto } from '../types/service';

interface PropuestaComparisonModalProps {
  propuestas: PropuestaDto[];
  onClose: () => void;
}

const moneyFmt = new Intl.NumberFormat('es-UY');
const dateFmtShort = new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium' });

const PropuestaComparisonModal = ({ propuestas, onClose }: PropuestaComparisonModalProps) => {
  const totales = propuestas.map((p) => p.totalEstimado);
  const minTotal = Math.min(...totales);

  return (
    <div className="comparar-modal">
      <button
        type="button"
        className="comparar-modal__backdrop"
        aria-label="Cerrar comparación"
        onClick={onClose}
      />
      <dialog open className="comparar-modal__box" aria-label="Comparar propuestas">
        <div className="comparar-modal__header">
          <h2 className="comparar__title">Comparar propuestas</h2>
          <button
            type="button"
            className="comparar-modal__close"
            onClick={onClose}
            aria-label="Cerrar comparación"
          >
            ✕
          </button>
        </div>

        <div className="comparar__table-wrapper">
          <table className="comparar__table">
            <thead>
              <tr>
                <th></th>
                {propuestas.map((p) => (
                  <th key={p.id}>{p.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Fecha de creación</th>
                {propuestas.map((p) => (
                  <td key={p.id}>{dateFmtShort.format(new Date(p.fechaCreacion))}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Salón</th>
                {propuestas.map((p) => (
                  <td key={p.id}>
                    {p.salon.nombre}
                    <br />
                    <span className="comparar__precio">
                      desde $ {moneyFmt.format(p.salon.precioMinimo)}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Servicios</th>
                {propuestas.map((p) => (
                  <td key={p.id}>
                    {p.servicios.length === 0 ? (
                      <span className="comparar__empty">—</span>
                    ) : (
                      <ul className="comparar__servicios-list">
                        {p.servicios.map((s) => (
                          <li key={s.id}>
                            {s.nombre}{' '}
                            <span className="comparar__servicio-tipo">({s.tipoServicio})</span> — ${' '}
                            {moneyFmt.format(s.precioMinimo)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Total estimado</th>
                {propuestas.map((p) => (
                  <td key={p.id} className={p.totalEstimado === minTotal ? 'comparar__total--min' : ''}>
                    $ {moneyFmt.format(p.totalEstimado)}
                    {p.totalEstimado === minTotal && (
                      <span className="comparar__badge-min">Más económica</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </dialog>
    </div>
  );
};

export default PropuestaComparisonModal;
