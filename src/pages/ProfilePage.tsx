import { useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import { updateProfileImage } from '../services/authService';
import CloudinaryImagePicker from '../components/CloudinaryImagePicker';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentProfileImageUrl = profileImageUrl ?? user?.profileImageUrl ?? '';

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    setIsLoading(true);

    try {
      await updateProfileImage(currentProfileImageUrl.trim());
      await refreshUser();
      setSuccess(true);
      setProfileImageUrl(null);
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
          <CloudinaryImagePicker
            label="Nueva imagen de perfil"
            hint="Subila desde tu dispositivo; podés reemplazar o quitar la imagen actual antes de guardar."
            imageUrls={currentProfileImageUrl ? [currentProfileImageUrl] : []}
            onImageUrlsChange={(urls) => setProfileImageUrl(urls[0] ?? '')}
            disabled={isLoading}
          />

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
