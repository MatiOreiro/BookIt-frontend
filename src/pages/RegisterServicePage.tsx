import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { registerVendor } from '../services/authService';
import { getEventCategories, getTags, type CatalogOption } from '../services/catalogService';
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
  const [tipoServicio, setTipoServicio] = useState('');
  const [precioMinimo, setPrecioMinimo] = useState('');
  const [precioMaximo, setPrecioMaximo] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [tags, setTags] = useState<CatalogOption[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [capacidad, setCapacidad] = useState('');
  const [mostrarCapacidad, setMostrarCapacidad] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [mostrarDireccion, setMostrarDireccion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedType = useMemo(() => tipoServicio.trim(), [tipoServicio]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesResponse = await getEventCategories();
        setCategories(categoriesResponse);
      } catch (catalogError) {
        console.error('Error cargando catálogos de servicio', catalogError);
        setCategories([]);
        setCategoriesError('No se pudieron cargar las categorías disponibles. Seguí con el formulario sin categorías.');
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadTags = async () => {
      if (selectedType !== 'Servicio' || tags.length > 0 || isTagsLoading) {
        return;
      }

      setIsTagsLoading(true);
      setTagsError(null);

      try {
        const tagsResponse = await getTags();
        setTags(tagsResponse);
      } catch (catalogError) {
        console.error('Error cargando tags de servicio', catalogError);
        setTagsError('No se pudieron cargar los tags desde el backend.');
      } finally {
        setIsTagsLoading(false);
      }
    };

    loadTags();
  }, [isTagsLoading, selectedType, tags.length]);

  const isVendorRole = (role: string) => {
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'vendedor' || normalizedRole === 'vendor' || normalizedRole === 'salon';
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedType) {
      setError('Seleccioná un tipo de servicio.');
      return;
    }

    if (selectedType === 'Servicio' && selectedCategoryIds.length === 0) {
      setError('Para un servicio, seleccioná al menos una categoría.');
      return;
    }

    if (selectedType === 'Servicio' && tags.length > 0 && !selectedTagId) {
      setError('Seleccioná el tag del servicio.');
      return;
    }

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
        TipoServicio: selectedType,
        PrecioMinimo: Number.parseFloat(precioMinimo),
        PrecioMaximo: Number.parseFloat(precioMaximo),
        CategoryIds: selectedCategoryIds,
        TagIds: selectedTagId ? [selectedTagId] : undefined,
        ...(capacidad && { Capacidad: Number.parseInt(capacidad) }),
        ...(direccion && { Direccion: direccion }),
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

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  };

  const isServiceType = selectedType === 'Servicio';

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--wide">
        <h1>Registrar salón o servicio</h1>
        <p>
          Completá los datos básicos y elegí el tipo de servicio. Las categorías se pueden
          seleccionar con un solo clic y, si elegís Servicio, vas a poder elegir también un tag.
        </p>

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
            <label htmlFor="tipoServicio">Tipo de servicio</label>
            <select
              id="tipoServicio"
              value={tipoServicio}
              onChange={(e) => {
                const nextType = e.target.value;
                setTipoServicio(nextType);
                if (nextType !== 'Servicio') {
                  setSelectedTagId('');
                }
              }}
              required
              disabled={isLoading}
            >
              <option value="">Seleccionar tipo</option>
              <option value="Salón">Salón</option>
              <option value="Servicio">Servicio</option>
            </select>
          </div>

          <fieldset className="form-group form-group--fieldset">
            <legend className="form-group__legend">Categorías</legend>
            <span className="form-group__hint">
              Seleccioná una o varias categorías sin usar combinaciones especiales.
            </span>

            <div className="selection-grid" aria-label="Categorías de evento">
              {categories.map((category) => {
                const isSelected = selectedCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    className={isSelected ? 'selection-chip is-selected' : 'selection-chip'}
                    onClick={() => toggleCategory(category.id)}
                    disabled={isLoading}
                    aria-pressed={isSelected}
                  >
                    {category.name}
                  </button>
                );
              })}
              {categories.length === 0 && !error && (
                <div className="selection-empty">Cargando categorías disponibles...</div>
              )}
            </div>
          </fieldset>

          {isServiceType && (
            <fieldset className="form-group form-group--fieldset">
              <legend className="form-group__legend">Tag del servicio</legend>
              <span className="form-group__hint">
                Elegí el tag que mejor describa el servicio que ofrecés.
              </span>

              {tagsError && <div className="auth-error">{tagsError}</div>}

              <div className="selection-radio-grid" aria-label="Tags del servicio">
                {isTagsLoading && tags.length === 0 && (
                  <div className="selection-empty">Cargando tags disponibles...</div>
                )}
                {tags.map((tag) => {
                  const isSelected = selectedTagId === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={isSelected ? 'selection-radio is-selected' : 'selection-radio'}
                      onClick={() => setSelectedTagId(tag.id)}
                      disabled={isLoading}
                      aria-pressed={isSelected}
                    >
                      <strong>{tag.name}</strong>
                      <span>Disponible para tu publicación</span>
                    </button>
                  );
                })}
                {!isTagsLoading && tags.length === 0 && !tagsError && (
                  <div className="selection-empty">
                    Si no ves tags todavía, seguí con el formulario y volvé a intentarlo más tarde.
                  </div>
                )}
              </div>
            </fieldset>
          )}

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

          {!mostrarCapacidad && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMostrarCapacidad(true)}
              disabled={isLoading}
            >
              + Agregar capacidad
            </button>
          )}

          {mostrarCapacidad && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="capacidad">Capacidad</label>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => {
                    setMostrarCapacidad(false);
                    setCapacidad('');
                  }}
                  disabled={isLoading}
                  style={{ padding: '0', fontSize: '0.9rem' }}
                >
                  Remover
                </button>
              </div>
              <input
                id="capacidad"
                type="number"
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
                placeholder="Ej: 150"
                disabled={isLoading}
                min="0"
              />
            </div>
          )}

          {!mostrarDireccion && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMostrarDireccion(true)}
              disabled={isLoading}
            >
              + Agregar dirección específica
            </button>
          )}

          {mostrarDireccion && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="direccion">Dirección específica</label>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => {
                    setMostrarDireccion(false);
                    setDireccion('');
                  }}
                  disabled={isLoading}
                  style={{ padding: '0', fontSize: '0.9rem' }}
                >
                  Remover
                </button>
              </div>
              <input
                id="direccion"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección detallada del servicio"
                disabled={isLoading}
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrar servicio'}
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
