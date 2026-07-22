import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import usePropuestaDraft from '../../hooks/usePropuestaDraft';
import { createPropuesta } from '../../services/propuestaService';

const currencyFormatter = new Intl.NumberFormat('es-UY');

const PropuestaDrawer = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { draft, removeSalon, removeServicio, clear, isDrawerOpen, closeDrawer } = usePropuestaDraft();
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated || !isDrawerOpen) return null;

  const canSave = draft.salon != null && draft.servicios.length > 0 && nombre.trim().length > 0;

  const handleGuardar = async () => {
    if (!draft.salon || draft.servicios.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPropuesta({
        nombre: nombre.trim(),
        salonId: draft.salon.id,
        serviceIds: draft.servicios.map((s) => s.id),
      });
      clear();
      setNombre('');
      closeDrawer();
      toast.success('Propuesta guardada. Podés verla en Mis trámites.');
      navigate('/mis-tramites');
    } catch {
      setError('No se pudo guardar la propuesta. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVaciar = () => {
    clear();
    setNombre('');
    setError(null);
  };

  return (
    <div className="propuesta-drawer" role="dialog" aria-modal="true" aria-label="Propuesta en curso">
      <button
        type="button"
        className="propuesta-drawer__backdrop"
        aria-label="Cerrar"
        onClick={closeDrawer}
      />
      <div className="propuesta-drawer__panel">
        <div className="propuesta-drawer__header">
          <h2>Tu propuesta</h2>
          <button
            type="button"
            className="propuesta-drawer__close"
            onClick={closeDrawer}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="propuesta-drawer__body">
          <section className="propuesta-drawer__section">
            <h3>Salón</h3>
            {draft.salon ? (
              <div className="propuesta-drawer__item">
                <div>
                  <strong>{draft.salon.nombre}</strong>
                  <span className="propuesta-drawer__item-price">
                    Desde $ {currencyFormatter.format(draft.salon.precioMinimo)}
                  </span>
                </div>
                <button type="button" className="propuesta-drawer__remove" onClick={removeSalon}>
                  Quitar
                </button>
              </div>
            ) : (
              <p className="propuesta-drawer__empty">Elegí un salón para empezar tu propuesta.</p>
            )}
          </section>

          <section className="propuesta-drawer__section">
            <h3>Servicios</h3>
            {draft.servicios.length === 0 ? (
              <p className="propuesta-drawer__empty">Todavía no agregaste servicios.</p>
            ) : (
              <ul className="propuesta-drawer__list">
                {draft.servicios.map((s) => (
                  <li key={s.id} className="propuesta-drawer__item">
                    <div>
                      <strong>{s.nombre}</strong>
                      <span className="propuesta-drawer__item-price">
                        Desde $ {currencyFormatter.format(s.precioMinimo)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="propuesta-drawer__remove"
                      onClick={() => removeServicio(s.id)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <label className="propuesta-drawer__label" htmlFor="propuesta-nombre">
            Nombre de la propuesta
          </label>
          <input
            id="propuesta-nombre"
            type="text"
            className="propuesta-drawer__input"
            placeholder="Ej: Casamiento Marzo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          {error && (
            <p className="propuesta-drawer__error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="propuesta-drawer__actions">
          <button
            type="button"
            className="propuesta-drawer__save"
            onClick={handleGuardar}
            disabled={!canSave || submitting}
          >
            {submitting ? 'Guardando...' : 'Guardar propuesta'}
          </button>
          <button type="button" className="propuesta-drawer__clear" onClick={handleVaciar} disabled={submitting}>
            Vaciar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropuestaDrawer;
