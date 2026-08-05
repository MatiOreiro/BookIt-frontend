import { useState, type SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import usePropuestaDraft from '../hooks/usePropuestaDraft';
import { login } from '../services/authService';
import { createPropuesta } from '../services/propuestaService';
import axios from 'axios';

interface PendingPropuestaState {
  propuestaPending?: boolean;
  propuestaNombre?: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();
  const { draft, clear } = usePropuestaDraft();
  const pendingState = location.state as PendingPropuestaState | null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isVendorRole = (role: string) => {
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'vendedor' || normalizedRole === 'vendor' || normalizedRole === 'salon';
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await login({ email, password });
      setAuthData(data.token, data.user);

      if (pendingState?.propuestaPending && draft.salon && draft.servicios.length > 0) {
        try {
          await createPropuesta({
            nombre: pendingState.propuestaNombre ?? '',
            salonId: draft.salon.id,
            serviceIds: draft.servicios.map((s) => s.id),
          });
          clear();
          toast.success('Propuesta guardada. Podés verla en Mis trámites.');
          navigate('/mis-tramites');
          return;
        } catch {
          toast.error('No se pudo guardar tu propuesta automáticamente. Podés reintentar desde el carrito.');
        }
      }

      toast.success(`Bienvenido/a, ${data.user.name}!`);
      navigate(isVendorRole(data.user.role) ? '/vendor/dashboard' : '/');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ?? 'Credenciales inválidas. Intenta nuevamente.',
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
        <h1>Iniciar sesión</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tenés cuenta?{' '}
          <Link to="/register/user">Registrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
