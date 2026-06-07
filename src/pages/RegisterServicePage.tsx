import { useEffect, useState, type SyntheticEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getServiceById, registerService, updateService } from '../services/serviceService';
import { getBarriosByDepartamento, getDepartamentos, type BarrioOption, type DepartamentoOption } from '../services/geographyService';
import { getEventCategories, getTags, type CatalogOption } from '../services/catalogService';
import axios from 'axios';
import CloudinaryImagePicker from '../components/CloudinaryImagePicker';

const RegisterServicePage = () => {
  const navigate = useNavigate();
  const { id: serviceId } = useParams();
  const { user, refreshUser } = useAuth();

  const [tipoServicio, setTipoServicio] = useState('');
  const [nombreServicio, setNombreServicio] = useState('');
  const [descripcionServicio, setDescripcionServicio] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [barrioId, setBarrioId] = useState('');
  const [calle, setCalle] = useState('');
  const [precioMinimo, setPrecioMinimo] = useState('');
  const [precioMaximo, setPrecioMaximo] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [serviceImageUrls, setServiceImageUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [tags, setTags] = useState<CatalogOption[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);
  const [barrios, setBarrios] = useState<BarrioOption[]>([]);
  const [isDepartamentosLoading, setIsDepartamentosLoading] = useState(false);
  const [isBarriosLoading, setIsBarriosLoading] = useState(false);
  const [departamentosError, setDepartamentosError] = useState<string | null>(null);
  const [barriosError, setBarriosError] = useState<string | null>(null);
  const [capacidad, setCapacidad] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = Boolean(serviceId);
  const selectedType = tipoServicio.trim();

  useEffect(() => {
    const loadDepartamentos = async () => {
      setIsDepartamentosLoading(true);
      setDepartamentosError(null);

      try {
        const departamentosResponse = await getDepartamentos();
        setDepartamentos(departamentosResponse);
      } catch (catalogError) {
        console.error('Error cargando departamentos', catalogError);
        setDepartamentos([]);
        setDepartamentosError('No se pudieron cargar los departamentos.');
      } finally {
        setIsDepartamentosLoading(false);
      }
    };

    loadDepartamentos();
  }, []);

  useEffect(() => {
    const loadBarrios = async () => {
      if (!departamentoId) {
        setBarrios([]);
        setBarrioId('');
        setBarriosError(null);
        return;
      }

      setIsBarriosLoading(true);
      setBarriosError(null);

      try {
        const barriosResponse = await getBarriosByDepartamento(departamentoId);
        setBarrios(barriosResponse);
      } catch (catalogError) {
        console.error('Error cargando barrios', catalogError);
        setBarrios([]);
        setBarriosError('No se pudieron cargar los barrios del departamento seleccionado.');
      } finally {
        setIsBarriosLoading(false);
      }
    };

    loadBarrios();
  }, [departamentoId]);

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

  useEffect(() => {
    const loadServiceForEdit = async () => {
      if (!serviceId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const loadedService = await getServiceById(serviceId);

        setTipoServicio(loadedService.tipoServicio || '');
        setNombreServicio(loadedService.nombre || '');
        setDescripcionServicio(loadedService.descripcion || '');
        setPrecioMinimo(String(loadedService.precioMinimo ?? ''));
        setPrecioMaximo(String(loadedService.precioMaximo ?? ''));
        setCapacidad(loadedService.capacidad ? String(loadedService.capacidad) : '');
        setSelectedCategoryIds(loadedService.categorias?.map((category) => category.id) ?? []);

        const departamentoFromService = loadedService.direccion?.barrio?.departamentoId ?? loadedService.direccion?.departamento?.id ?? '';
        const barrioFromService = loadedService.direccion?.barrio?.id ?? '';

        setDepartamentoId(departamentoFromService);
        setBarrioId(barrioFromService);
        setCalle(loadedService.direccion?.calle || '');
        setServiceImageUrls(loadedService.imagenes ?? []);
      } catch (serviceError) {
        console.error('Error cargando servicio para edición', serviceError);
        setError('No se pudo cargar el servicio para editarlo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadServiceForEdit();
  }, [serviceId]);

  const isVendorRole = (role: string) => {
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'vendedor' || normalizedRole === 'vendor' || normalizedRole === 'salon';
  };

  const getFormValidationError = (): string | null => {
    if (!selectedType) {
      return 'Seleccioná un tipo de servicio.';
    }

    if (!departamentoId) {
      return 'Seleccioná un departamento.';
    }

    if (!barrioId) {
      return 'Seleccioná un barrio.';
    }

    if (!calle.trim()) {
      return 'Ingresá la calle.';
    }

    if (selectedType === 'Salón') {
      const capacityValue = Number.parseInt(capacidad, 10);
      if (!capacidad || !Number.isInteger(capacityValue) || capacityValue < 1) {
        return 'La capacidad es obligatoria para los salones y debe ser mayor a 0.';
      }
    }

    if (selectedType === 'Servicio' && selectedCategoryIds.length === 0) {
      return 'Para un servicio, seleccioná al menos una categoría.';
    }

    if (selectedType === 'Servicio' && tags.length > 0 && !selectedTagId) {
      return 'Seleccioná el tag del servicio.';
    }

    return null;
  };

  const buildServicePayload = () => {
    const departamento = departamentos.find((item) => item.id === departamentoId);
    const barrio = barrios.find((item) => item.id === barrioId);

    const ubicacion = [calle.trim(), barrio?.nombre, departamento?.nombre]
      .filter(Boolean)
      .join(', ');

    return {
      Nombre: nombreServicio,
      Descripcion: descripcionServicio,
      Ubicacion: ubicacion,
      TipoServicio: selectedType,
      PrecioMinimo: Number.parseFloat(precioMinimo),
      PrecioMaximo: Number.parseFloat(precioMaximo),
      Direccion: {
        DepartamentoId: departamentoId,
        BarrioId: barrioId,
        Calle: calle.trim(),
      },
      CategoryIds: selectedCategoryIds,
      TagIds: selectedTagId ? [selectedTagId] : undefined,
      ...(capacidad && { Capacidad: Number.parseInt(capacidad) }),
      Images: serviceImageUrls,
    };
  };

  const getRedirectPath = (role: string) => {
    if (serviceId) {
      return '/vendor/dashboard';
    }

    return isVendorRole(role) ? '/vendor/dashboard' : '/';
  };

  let submitButtonLabel = 'Registrar salón o servicio';
  if (isEditing) {
    submitButtonLabel = isLoading ? 'Guardando...' : 'Guardar cambios';
  } else if (isLoading) {
    submitButtonLabel = 'Registrando...';
  }

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = getFormValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const payload = buildServicePayload();

      if (serviceId) {
        await updateService(serviceId, payload);
      } else {
        await registerService(payload);
      }

      const refreshedUser = serviceId ? null : await refreshUser();
      setSuccess(true);
      const nextRole = refreshedUser?.role ?? user?.role ?? '';
      setTimeout(() => navigate(getRedirectPath(nextRole)), 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string; title?: string; errors?: Record<string, string[]> }
          | undefined;

        const validationMessages = responseData?.errors
          ? Object.values(responseData.errors).flat().filter(Boolean)
          : [];

        setError(
          responseData?.message
            ?? responseData?.title
            ?? validationMessages[0]
            ?? 'Error al registrar el servicio.',
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
  const selectedDepartamento = departamentos.find((item) => item.id === departamentoId);
  const locationPreview = [calle.trim(), barrios.find((item) => item.id === barrioId)?.nombre, selectedDepartamento?.nombre]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--wide">
        <h1>{isEditing ? 'Editar salón o servicio' : 'Registrar salón o servicio'}</h1>
        <p>
          {isEditing
            ? 'Actualizá los datos del servicio y guardá los cambios cuando termines.'
            : 'Elegí primero el tipo de servicio y completá la dirección con departamento, barrio y calle.'}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {success && (
          <div className="auth-success">
            {isEditing ? '¡Servicio actualizado exitosamente! Redirigiendo...' : '¡Servicio registrado exitosamente! Redirigiendo...'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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

          <div className="form-group">
            <label htmlFor="nombreServicio">Nombre del salón o servicio</label>
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
            <label htmlFor="departamento">Departamento</label>
            <select
              id="departamento"
              value={departamentoId}
              onChange={(e) => {
                setDepartamentoId(e.target.value);
                setBarrioId('');
              }}
              required
              disabled={isLoading || isDepartamentosLoading}
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.nombre}
                </option>
              ))}
            </select>
            {departamentosError && <div className="auth-error">{departamentosError}</div>}
          </div>

          {departamentoId && (
            <div className="form-group">
              <label htmlFor="barrio">Barrio</label>
              <select
                id="barrio"
                value={barrioId}
                onChange={(e) => setBarrioId(e.target.value)}
                required
                disabled={isLoading || isBarriosLoading || barrios.length === 0}
              >
                <option value="">Seleccionar barrio</option>
                {barrios.map((barrio) => (
                  <option key={barrio.id} value={barrio.id}>
                    {barrio.nombre}
                  </option>
                ))}
              </select>
              {isBarriosLoading && <span className="form-group__hint">Cargando barrios...</span>}
              {barriosError && <div className="auth-error">{barriosError}</div>}
              {!isBarriosLoading && barrios.length === 0 && !barriosError && (
                <span className="form-group__hint">
                  No hay barrios disponibles para este departamento.
                </span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="calle">Calle</label>
            <input
              id="calle"
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Av. 18 de Julio 1234"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ubicacionCompuesta">Ubicación compuesta</label>
            <input
              id="ubicacionCompuesta"
              type="text"
              value={locationPreview}
              placeholder="Se completa automáticamente"
              disabled
            />
          </div>

          <fieldset className="form-group form-group--fieldset">
            <legend className="form-group__legend">Categorías</legend>
            <span className="form-group__hint">
              Seleccioná una o varias categorías sin usar combinaciones especiales.
            </span>

            {categoriesError && <div className="auth-error">{categoriesError}</div>}

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

          <div className="form-group">
            <label htmlFor="capacidad">Capacidad</label>
            <input
              id="capacidad"
              type="number"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              placeholder={selectedType === 'Salón' ? 'Ej: 150' : 'Opcional para servicios'}
              required={selectedType === 'Salón'}
              disabled={isLoading}
              min="1"
            />
            <span className="form-group__hint">
              {selectedType === 'Salón'
                ? 'Para salones este dato es obligatorio.'
                : 'Solo es obligatorio cuando registrás un salón.'}
            </span>
          </div>

          <CloudinaryImagePicker
            label="Imágenes del servicio"
            hint={isEditing
              ? 'Subí imágenes nuevas o quitá las que no quieras conservar antes de guardar.'
              : 'Subí una o varias fotos para que aparezcan en el detalle del servicio.'}
            imageUrls={serviceImageUrls}
            onImageUrlsChange={setServiceImageUrls}
            multiple
            disabled={isLoading}
          />

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {submitButtonLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterServicePage;
