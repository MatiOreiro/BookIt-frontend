import { useState, type SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { registerUser } from '../services/authService';
import axios from 'axios';
import CloudinaryImagePicker from '../components/CloudinaryImagePicker';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;
const PASSWORD_REQUIREMENTS_HINT =
  'Debe tener al menos 8 caracteres, con mayúsculas, minúsculas, números y un carácter especial (@$!%*?&).';

const RegisterUserPage = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};

    if (!PASSWORD_REGEX.test(password)) {
      nextFieldErrors.password = PASSWORD_REQUIREMENTS_HINT;
    } else if (password !== confirmPassword) {
      nextFieldErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const data = await registerUser({
        Nombre: nombre,
        Telefono: telefono,
        Email: email,
        Password: password,
        Rol: 'usuario',
        ProfileImageUrl: profileImageUrl.trim() || undefined,
      });
      setAuthData(data.token, data.user);
      navigate('/');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const backendErrors = err.response?.data?.errors as
          | Record<string, string[]>
          | undefined;

        if (backendErrors) {
          const mappedErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(backendErrors)) {
            if (messages.length > 0) {
              mappedErrors[key.toLowerCase()] = messages[0];
            }
          }
          setFieldErrors(mappedErrors);
        }

        setError(
          err.response?.data?.message ?? 'Error al registrarse. Intenta nuevamente.',
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
        <h1>Crear cuenta</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              required
              disabled={isLoading}
            />
            {fieldErrors.nombre && (
              <span className="form-group__error">{fieldErrors.nombre}</span>
            )}
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
            {fieldErrors.telefono && (
              <span className="form-group__error">{fieldErrors.telefono}</span>
            )}
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
            {fieldErrors.email && (
              <span className="form-group__error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              minLength={8}
              maxLength={128}
            />
            {isPasswordFocused && !fieldErrors.password && (
              <span className="form-group__hint">{PASSWORD_REQUIREMENTS_HINT}</span>
            )}
            {fieldErrors.password && (
              <span className="form-group__error">{fieldErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              minLength={8}
              maxLength={128}
            />
            {fieldErrors.confirmPassword && (
              <span className="form-group__error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <CloudinaryImagePicker
            label="Foto de perfil"
            hint="Opcional."
            imageUrls={profileImageUrl ? [profileImageUrl] : []}
            onImageUrlsChange={(urls) => setProfileImageUrl(urls[0] ?? '')}
            disabled={isLoading}
          />

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login">Iniciá sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterUserPage;
