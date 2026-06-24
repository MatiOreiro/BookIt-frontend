import axios from 'axios';
import apiClient from '../api/axiosClient';
import type {
  ConfirmarReservaRequest,
  ConfirmVisitReservationData,
  CreateReservaRequest,
  CreateVisitaRequest,
  PagoDto,
  RegisterServiceRequest,
  ReservationDto,
  ReservationUserDto,
  Service,
  ServiceFilters,
  VisitDto,
} from '../types/service';

const pickString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const pickNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const pickNullableNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const getArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

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

const normalizePago = (raw: unknown): PagoDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    reservaId: pickString(item.reservaId ?? item.ReservaId),
    tipoPago: pickString(item.tipoPago ?? item.TipoPago) as PagoDto['tipoPago'],
    importe: pickNumber(item.importe ?? item.Importe),
    fechaPago: pickString(item.fechaPago ?? item.FechaPago),
    fechaCreacion: pickString(item.fechaCreacion ?? item.FechaCreacion),
    fechaActualizacion: pickString(item.fechaActualizacion ?? item.FechaActualizacion),
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
    montoAcordado: pickNullableNumber(item.montoAcordado ?? item.MontoAcordado),
    horasReservadas: pickNullableNumber(item.horasReservadas ?? item.HorasReservadas),
    pagos: getArray(item.pagos ?? item.Pagos).map(normalizePago),
    serviceNombre: pickString(item.serviceNombre ?? item.ServiceNombre) || null,
    precioMinimo: pickNullableNumber(item.precioMinimo ?? item.PrecioMinimo),
    precioMaximo: pickNullableNumber(item.precioMaximo ?? item.PrecioMaximo),
    vendorNombre: pickString(item.vendorNombre ?? item.VendorNombre) || null,
    vendorEmail: pickString(item.vendorEmail ?? item.VendorEmail) || null,
    vendorTelefono: pickString(item.vendorTelefono ?? item.VendorTelefono) || null,
  };
};

const normalizeVisit = (raw: unknown): VisitDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    serviceId: pickString(item.serviceId ?? item.ServiceId),
    serviceNombre: pickString(item.serviceNombre ?? item.ServiceNombre) || null,
    userId: pickString(item.userId ?? item.UserId),
    userNombre: pickString(item.userNombre ?? item.UserNombre) || null,
    userEmail: pickString(item.userEmail ?? item.UserEmail) || null,
    fechaHoraSolicitada: pickString(item.fechaHoraSolicitada ?? item.FechaHoraSolicitada),
    estado: pickString(item.estado ?? item.Estado),
    mensaje: pickString(item.mensaje ?? item.Mensaje) || null,
    fechaCreacion: pickString(item.fechaCreacion ?? item.FechaCreacion),
    vendorNombre: pickString(item.vendorNombre ?? item.VendorNombre) || null,
    vendorEmail: pickString(item.vendorEmail ?? item.VendorEmail) || null,
    vendorTelefono: pickString(item.vendorTelefono ?? item.VendorTelefono) || null,
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

const normalizeVendor = (raw: unknown): Service['vendor'] => {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const item = raw as Record<string, unknown>;
  const id = pickString(item.id ?? item.Id);
  const nombre = pickString(item.nombre ?? item.Nombre);
  const telefono = pickString(item.telefono ?? item.Telefono);
  const email = pickString(item.email ?? item.Email);
  const profileImageUrlRaw = item.profileImageUrl ?? item.ProfileImageUrl;
  const profileImageUrl =
    typeof profileImageUrlRaw === 'string' && profileImageUrlRaw.length > 0
      ? profileImageUrlRaw
      : null;

  if (!id && !nombre && !telefono && !email) {
    return undefined;
  }

  return { id, nombre, telefono, email, profileImageUrl };
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

  const normalizedReservations = getArray(item.reservas ?? item.Reservas)
    .map(normalizeReservation)
    .filter((reservation) => Boolean(reservation.fechaReservaCliente));

  const normalizedVisits = getArray(item.visitas ?? item.Visitas)
    .map(normalizeVisit)
    .filter((visit) => Boolean(visit.fechaHoraSolicitada));

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
    vendor: normalizeVendor(item.vendor ?? item.Vendor),
    categorias: categoriasRaw.map(normalizeCategory),
    reservas: normalizedReservations,
    visitas: normalizedVisits,
    imagenes: imagenesRaw.map((image) => pickString(image)).filter(Boolean),
    direccion: normalizeAddress(direccionRaw),
  };
};

export const registerService = async (
  data: RegisterServiceRequest,
): Promise<Service> => {
  const response = await apiClient.post<unknown>('/services', data);
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
  const response = await apiClient.put<unknown>(`/services/${id}`, data);
  return normalizeService(response.data);
};

export const deleteService = async (id: string): Promise<void> => {
  await apiClient.delete(`/services/${id}`);
};

export const createVisita = async (data: CreateVisitaRequest): Promise<VisitDto> => {
  const response = await apiClient.post<unknown>('/visitas', data);
  return normalizeVisit(response.data);
};

export const createReserva = async (data: CreateReservaRequest): Promise<ReservationDto> => {
  const response = await apiClient.post<unknown>('/reservas', data);
  return normalizeReservation(response.data);
};

export const confirmVisitAndMaybeCreateReservation = async (
  visitaId: string,
  crearReserva: boolean,
  reservationData?: ConfirmVisitReservationData,
): Promise<unknown> => {
  const body: Record<string, unknown> = { CrearReserva: crearReserva };
  if (crearReserva && reservationData) {
    body.FechaReservaCliente = reservationData.fechaReservaCliente;
    body.HorasReservadas = reservationData.horasReservadas;
    body.MontoAcordado = reservationData.montoAcordado;
  }
  const response = await apiClient.post<unknown>(`/visitas/${visitaId}/confirmar`, body);
  return response.data;
};

export const rejectVisit = async (visitaId: string): Promise<void> => {
  await apiClient.delete(`/visitas/${visitaId}`);
};

export const confirmReservation = async (reservaId: string, data: ConfirmarReservaRequest): Promise<ReservationDto> => {
  const response = await apiClient.post<unknown>(`/reservas/${reservaId}/confirmar`, {
    HorasReservadas: data.horasReservadas,
    MontoAcordado: data.montoAcordado,
  });
  return normalizeReservation(response.data);
};

export const updateReservaFinanciero = async (reservaId: string, data: ConfirmarReservaRequest): Promise<ReservationDto> => {
  const response = await apiClient.put<unknown>(`/reservas/${reservaId}/financiero`, {
    HorasReservadas: data.horasReservadas,
    MontoAcordado: data.montoAcordado,
  });
  return normalizeReservation(response.data);
};

export const rejectReservation = async (reservaId: string): Promise<void> => {
  try {
    await apiClient.delete(`/reservas/${reservaId}`);
  } catch (error) {
    // Compatibility fallback for stale/mixed data where a visit ID is shown in reservation UI.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      await apiClient.delete(`/visitas/${reservaId}`);
      return;
    }

    throw error;
  }
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

export const getMyReservas = async (): Promise<ReservationDto[]> => {
  const response = await apiClient.get<unknown>('/reservas/mis-reservas');
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(normalizeReservation);
};

export const getMyVisitas = async (): Promise<VisitDto[]> => {
  const response = await apiClient.get<unknown>('/visitas/mis-visitas');
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(normalizeVisit);
};
