import apiClient from '../api/axiosClient';
import type {
  RegisterServiceRequest,
  ReservationDto,
  ReservationUserDto,
  Service,
  ServiceFilters,
} from '../types/service';

const pickString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const pickNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const pickNullableNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const getArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const appendValue = (formData: FormData, key: string, value: string | number | boolean | File | null | undefined) => {
  if (value instanceof File) {
    formData.append(key, value);
    return;
  }

  if (value === null || value === undefined || value === '') {
    return;
  }

  formData.append(key, String(value));
};

const extractItems = (
  payload: unknown[] | { value?: unknown[]; data?: unknown[]; items?: unknown[] } | null,
): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.value)) {
    return payload.value;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const normalizeCategory = (raw: unknown): { id: string; nombre: string } => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    nombre: pickString(item.nombre ?? item.Nombre),
  };
};

const normalizeReservationUser = (raw: unknown): ReservationUserDto | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    nombre: pickString(item.nombre ?? item.Nombre),
    telefono: pickString(item.telefono ?? item.Telefono),
    email: pickString(item.email ?? item.Email),
    rol: pickString(item.rol ?? item.Rol),
    activo: Boolean(item.activo ?? item.Activo),
    fechaCreacion: pickString(item.fechaCreacion ?? item.FechaCreacion),
    fechaActualizacion: pickString(item.fechaActualizacion ?? item.FechaActualizacion),
  };
};

const normalizeReservation = (raw: unknown): ReservationDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    serviceId: pickString(item.serviceId ?? item.ServiceId),
    userId: pickString(item.userId ?? item.UserId),
    confirmada: Boolean(item.confirmada ?? item.Confirmada),
    fechaReservaCliente: pickString(item.fechaReservaCliente ?? item.FechaReservaCliente),
    usuario: normalizeReservationUser(item.usuario ?? item.Usuario),
  };
};

const normalizeDepartment = (raw: unknown): { id: string; nombre: string } | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const item = raw as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    nombre: pickString(item.nombre ?? item.Nombre),
  };
};

const normalizeNeighborhood = (
  raw: unknown,
): { id: string; departamentoId: string; nombre: string; departamento?: { id: string; nombre: string } } | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const item = raw as Record<string, unknown>;
  const departmentRaw = item.departamento ?? item.Departamento;

  return {
    id: pickString(item.id ?? item.Id),
    departamentoId: pickString(item.departamentoId ?? item.DepartamentoId),
    nombre: pickString(item.nombre ?? item.Nombre),
    departamento: normalizeDepartment(departmentRaw),
  };
};

const normalizeAddress = (raw: unknown): Service['direccion'] => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    calle: pickString(item.calle ?? item.Calle),
    departamento: normalizeDepartment(item.departamento ?? item.Departamento),
    barrio: normalizeNeighborhood(item.barrio ?? item.Barrio),
  };
};

const normalizeService = (raw: unknown): Service => {
  const item = (raw ?? {}) as Record<string, unknown>;
  const direccionRaw = (item.direccion ?? item.Direccion ?? null) as Record<string, unknown> | null;
  const categoriasRaw = getArray(item.categorias ?? item.Categorias);
  const imagenesRaw = getArray(item.imagenes ?? item.Imagenes);

  return {
    id: pickString(item.id ?? item.Id),
    vendorId: pickString(item.vendorId ?? item.VendorId),
    nombre: pickString(item.nombre ?? item.Nombre),
    descripcion: pickString(item.descripcion ?? item.Descripcion),
    ubicacion: pickString(item.ubicacion ?? item.Ubicacion),
    tipoServicio: pickString(item.tipoServicio ?? item.TipoServicio),
    precioMinimo: pickNumber(item.precioMinimo ?? item.PrecioMinimo),
    precioMaximo: pickNumber(item.precioMaximo ?? item.PrecioMaximo),
    capacidad: pickNullableNumber(item.capacidad ?? item.Capacidad),
    activo: Boolean(item.activo ?? item.Activo),
    fechaCreacion: pickString(item.fechaCreacion ?? item.FechaCreacion),
    fechaActualizacion: pickString(item.fechaActualizacion ?? item.FechaActualizacion),
    categorias: categoriasRaw.map(normalizeCategory),
    reservas: getArray(item.reservas ?? item.Reservas).map(normalizeReservation),
    imagenes: imagenesRaw.map((image) => pickString(image)).filter(Boolean),
    direccion: normalizeAddress(direccionRaw),
  };
};

export const registerService = async (
  data: RegisterServiceRequest,
): Promise<Service> => {
  const formData = new FormData();
  appendValue(formData, 'Nombre', data.Nombre);
  appendValue(formData, 'Descripcion', data.Descripcion);
  appendValue(formData, 'Ubicacion', data.Ubicacion);
  appendValue(formData, 'PrecioMinimo', data.PrecioMinimo);
  appendValue(formData, 'PrecioMaximo', data.PrecioMaximo);
  appendValue(formData, 'TipoServicio', data.TipoServicio);
  appendValue(formData, 'Capacidad', data.Capacidad);
  appendValue(formData, 'Direccion.DepartamentoId', data.Direccion.DepartamentoId);
  appendValue(formData, 'Direccion.BarrioId', data.Direccion.BarrioId);
  appendValue(formData, 'Direccion.Calle', data.Direccion.Calle);
  data.CategoryIds?.forEach((categoryId) => appendValue(formData, 'CategoryIds', categoryId));
  data.TagIds?.forEach((tagId) => appendValue(formData, 'TagIds', tagId));
  data.Images?.forEach((image) => appendValue(formData, 'Images', image));

  const response = await apiClient.post<unknown>('/services', formData);
  return normalizeService(response.data);
};

export const getServiceById = async (id: string): Promise<Service> => {
  const response = await apiClient.get<unknown>(`/services/${id}`);
  return normalizeService(response.data);
};

export const updateService = async (
  id: string,
  data: RegisterServiceRequest,
): Promise<Service> => {
  const formData = new FormData();
  appendValue(formData, 'Nombre', data.Nombre);
  appendValue(formData, 'Descripcion', data.Descripcion);
  appendValue(formData, 'Ubicacion', data.Ubicacion);
  appendValue(formData, 'PrecioMinimo', data.PrecioMinimo);
  appendValue(formData, 'PrecioMaximo', data.PrecioMaximo);
  appendValue(formData, 'TipoServicio', data.TipoServicio);
  appendValue(formData, 'Capacidad', data.Capacidad);
  appendValue(formData, 'Direccion.DepartamentoId', data.Direccion.DepartamentoId);
  appendValue(formData, 'Direccion.BarrioId', data.Direccion.BarrioId);
  appendValue(formData, 'Direccion.Calle', data.Direccion.Calle);
  data.CategoryIds?.forEach((categoryId) => appendValue(formData, 'CategoryIds', categoryId));
  data.TagIds?.forEach((tagId) => appendValue(formData, 'TagIds', tagId));
  data.Images?.forEach((image) => appendValue(formData, 'Images', image));

  const response = await apiClient.put<unknown>(`/services/${id}`, formData);
  return normalizeService(response.data);
};

export const deleteService = async (id: string): Promise<void> => {
  await apiClient.delete(`/services/${id}`);
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
    const payload = response.data as unknown[] | { value?: unknown[]; data?: unknown[]; items?: unknown[] } | null;

    return extractItems(payload).map(normalizeService);
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};
