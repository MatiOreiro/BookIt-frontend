import { useState } from 'react';
import axios from 'axios';
import { createResena } from '../services/resenaService';
import type { ResenaDto } from '../types/service';
import CloudinaryMediaPicker from './CloudinaryMediaPicker';

const MAX_COMENTARIO_LENGTH = 2000;

interface ReviewFormProps {
  reservaId: string;
  onClose: () => void;
  onSubmitted: (resena: ResenaDto) => void;
}

const ReviewForm = ({ reservaId, onClose, onSubmitted }: ReviewFormProps) => {
  const [puntuacion, setPuntuacion] = useState(0);
  const [hoverPuntuacion, setHoverPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (puntuacion === 0) {
      setError('Elegí una puntuación de 1 a 5 estrellas.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const resena = await createResena({
        reservaId,
        puntuacion,
        comentario: comentario.trim() || undefined,
        mediaUrls,
      });
      onSubmitted(resena);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'No se pudo publicar la reseña. Intentá de nuevo más tarde.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="calculator-modal">
      <button
        type="button"
        className="calculator-modal__backdrop"
        aria-label="Cerrar formulario de reseña"
        onClick={onClose}
      />
      <dialog open className="calculator-modal__box" aria-label="Dejar reseña">
        <div className="calculator-modal__header">
          <h2 className="calculator__title">Dejá tu reseña</h2>
          <button
            type="button"
            className="calculator-modal__close"
            onClick={onClose}
            aria-label="Cerrar formulario de reseña"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="form-group">
            <label>Puntuación</label>
            <div className="review-form__stars" role="radiogroup" aria-label="Puntuación de 1 a 5 estrellas">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="review-form__star"
                  aria-label={`${value} estrella${value > 1 ? 's' : ''}`}
                  aria-pressed={puntuacion === value}
                  onMouseEnter={() => setHoverPuntuacion(value)}
                  onMouseLeave={() => setHoverPuntuacion(0)}
                  onClick={() => setPuntuacion(value)}
                >
                  {(hoverPuntuacion || puntuacion) >= value ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="review-comentario">Comentario (opcional)</label>
            <textarea
              id="review-comentario"
              value={comentario}
              maxLength={MAX_COMENTARIO_LENGTH}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              placeholder="Contanos cómo fue tu experiencia..."
            />
            <span className="form-group__hint">
              {comentario.length}/{MAX_COMENTARIO_LENGTH}
            </span>
          </div>

          <CloudinaryMediaPicker
            label="Fotos o videos (opcional)"
            mediaUrls={mediaUrls}
            onMediaUrlsChange={setMediaUrls}
            disabled={submitting}
          />

          {error && (
            <p className="mis-tramites__state mis-tramites__state--error" role="alert">
              {error}
            </p>
          )}

          <div className="review-form__actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Publicando...' : 'Publicar reseña'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
};

export default ReviewForm;
