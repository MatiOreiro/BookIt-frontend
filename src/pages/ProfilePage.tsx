import { useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import { updateProfileImage } from '../services/authService';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!profileImage) {
      setError('Seleccioná una imagen para actualizar tu perfil.');
      return;
    }

    setIsLoading(true);

    try {
      await updateProfileImage(profileImage);
      await refreshUser();
      setSuccess(true);
      setProfileImage(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'No pudimos actualizar tu imagen de perfil.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--wide">
        <h1>Mi perfil</h1>
        <p>Actualizá la imagen que se muestra en tu cuenta.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">Imagen de perfil actualizada correctamente.</div>}

        <div className="profile-preview">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={user?.name || 'Perfil'}
              className="profile-preview__image"
            />
          ) : (
            <div className="profile-preview__placeholder">👤</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="profileImage">Nueva imagen de perfil</label>
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files?.[0] ?? null)}
              disabled={isLoading}
            />
            {profileImage && <span className="form-group__hint">Archivo seleccionado: {profileImage.name}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Guardar imagen'}
          </button>
        </form>

        <p className="auth-footer auth-footer--secondary">
          <Link to="/change-password">Cambiar contraseña</Link>
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
