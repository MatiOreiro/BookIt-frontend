import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { registerVendor } from '../services/authService';
import axios from 'axios';

const RegisterServicePage = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreServicio, setNombreServicio] = useState('');
  const [descripcionServicio, setDescripcionServicio] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [precioMinimo, setPrecioMinimo] = useState('');
  const [precioMaximo, setPrecioMaximo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isVendorRole = (role: string) => {
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'vendedor' || normalizedRole === 'vendor' || normalizedRole === 'salon';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const data = await registerVendor({
        Nombre: nombre,
        Telefono: telefono,
        Email: email,
        Password: password,
        NombreServicio: nombreServicio,
        DescripcionServicio: descripcionServicio,
        Ubicacion: ubicacion,
        PrecioMinimo: Number.parseFloat(precioMinimo),
        PrecioMaximo: Number.parseFloat(precioMaximo),
      });
      setAuthData(data.token, data.user);
      setSuccess(true);
      setTimeout(() => navigate(isVendorRole(data.user.role) ? '/vendor/dashboard' : '/'), 1500);
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
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="09XXXXXXXX"
              required
              disabled={isLoading}
            />
          </div>

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
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="nombreServicio">Nombre del servicio</label>
            <input
              id="nombreServicio"
              type="text"
              value={nombreServicio}
              onChange={(e) => setNombreServicio(e.target.value)}
              placeholder="Ej: Catering premium"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcionServicio">Descripción</label>
            <textarea
              id="descripcionServicio"
              value={descripcionServicio}
              onChange={(e) => setDescripcionServicio(e.target.value)}
              placeholder="Describí tu servicio..."
              required
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ubicacion">Ubicación</label>
            <input
              id="ubicacion"
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Montevideo, Pocitos"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="precioMinimo">Precio mínimo</label>
            <input
              id="precioMinimo"
              type="number"
              value={precioMinimo}
              onChange={(e) => setPrecioMinimo(e.target.value)}
              placeholder="0.00"
              required
              disabled={isLoading}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="precioMaximo">Precio máximo</label>
            <input
              id="precioMaximo"
              type="number"
              value={precioMaximo}
              onChange={(e) => setPrecioMaximo(e.target.value)}
              placeholder="0.00"
              required
              disabled={isLoading}
              min="0"
              step="0.01"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrar salón'}
          </button>
        </form>

        <p className="auth-footer auth-footer--secondary">
          ¿Querés registrarte como usuario?{' '}
          <Link to="/register/user">Ir al registro de usuario</Link>
        </p>
        <p className="auth-footer auth-footer--secondary">
          <Link to="/register">Volver a elegir tipo de registro</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterServicePage;
