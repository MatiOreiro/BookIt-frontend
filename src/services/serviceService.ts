import apiClient from '../api/axiosClient';
import type { RegisterServiceRequest, Service, ServiceFilters } from '../types/service';

const pickString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const pickNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const normalizeCategory = (raw: unknown): { id: string; nombre: string } => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    nombre: pickString(item.nombre ?? item.Nombre),
  };
};

const normalizeService = (raw: unknown): Service => {
  const item = (raw ?? {}) as Record<string, unknown>;
  const categoriasRaw = Array.isArray(item.categorias)
    ? item.categorias
    : Array.isArray(item.Categorias)
      ? item.Categorias
      : [];

  return {
    id: pickString(item.id ?? item.Id),
    vendorId: pickString(item.vendorId ?? item.VendorId),
    nombre: pickString(item.nombre ?? item.Nombre),
    descripcion: pickString(item.descripcion ?? item.Descripcion),
    ubicacion: pickString(item.ubicacion ?? item.Ubicacion),
    tipoServicio: pickString(item.tipoServicio ?? item.TipoServicio),
    precioMinimo: pickNumber(item.precioMinimo ?? item.PrecioMinimo),
    precioMaximo: pickNumber(item.precioMaximo ?? item.PrecioMaximo),
    activo: Boolean(item.activo ?? item.Activo),
    fechaCreacion: pickString(item.fechaCreacion ?? item.FechaCreacion),
    fechaActualizacion: pickString(item.fechaActualizacion ?? item.FechaActualizacion),
    categorias: categoriasRaw.map(normalizeCategory),
  };
};

export const registerService = async (
  data: RegisterServiceRequest,
): Promise<Service> => {
  const response = await apiClient.post<Service>('/services', data);
  return response.data;
};

export const getServices = async (filters?: ServiceFilters): Promise<Service[]> => {
  const params = new URLSearchParams();
  if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
  if (filters?.location) params.append('location', filters.location);
  if (filters?.minPrice) params.append('minPrice', String(filters.minPrice));
  if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));
  if (filters?.tipoServicio) params.append('tipoServicio', filters.tipoServicio);
  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    filters.categoryIds.forEach((id) => params.append('categoryIds', id));
  }

  const query = params.toString();
  const url = query ? `/services/search?${query}` : '/services/active';

  try {
    const response = await apiClient.get<unknown>(url);
    const payload = response.data as
      | unknown[]
      | { value?: unknown[]; data?: unknown[]; items?: unknown[] }
      | null;

    const data = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.value)
        ? payload.value
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

    return data.map(normalizeService);
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};
