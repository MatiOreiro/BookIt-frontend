import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerService } from '../services/serviceService';
import axios from 'axios';

const SERVICE_CATEGORIES = [
  'Catering',
  'Fotografía',
  'Música',
  'Decoración',
  'Iluminación',
  'Seguridad',
  'Otro',
];

const RegisterServicePage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      await registerService({
        name,
        description,
        price: parseFloat(price),
        category,
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ?? 'Error al registrar el servicio.',
        );
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Registrar servicio</h1>

        {error && <div className="auth-error">{error}</div>}
        {success && (
          <div className="auth-success">
            ¡Servicio registrado exitosamente! Redirigiendo...
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Nombre del servicio</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Catering premium"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí tu servicio..."
              required
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Precio (USD)</label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
              disabled={isLoading}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={isLoading}
            >
              <option value="">Seleccioná una categoría</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrar servicio'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterServicePage;
