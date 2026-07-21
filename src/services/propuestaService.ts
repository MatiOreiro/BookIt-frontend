import apiClient from '../api/axiosClient';
import type { CreatePropuestaRequest, PropuestaDto, PropuestaItemDto } from '../types/service';

const pickString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const pickNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const getArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const normalizePropuestaItem = (raw: unknown): PropuestaItemDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    nombre: pickString(item.nombre ?? item.Nombre),
    tipoServicio: pickString(item.tipoServicio ?? item.TipoServicio),
    precioMinimo: pickNumber(item.precioMinimo ?? item.PrecioMinimo),
    vendorNombre: pickString(item.vendorNombre ?? item.VendorNombre) || null,
    vendorEmail: pickString(item.vendorEmail ?? item.VendorEmail) || null,
    vendorTelefono: pickString(item.vendorTelefono ?? item.VendorTelefono) || null,
  };
};

const normalizePropuesta = (raw: unknown): PropuestaDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    nombre: pickString(item.nombre ?? item.Nombre),
    fechaCreacion: pickString(item.fechaCreacion ?? item.FechaCreacion),
    salon: normalizePropuestaItem(item.salon ?? item.Salon),
    servicios: getArray(item.servicios ?? item.Servicios).map(normalizePropuestaItem),
    totalEstimado: pickNumber(item.totalEstimado ?? item.TotalEstimado),
  };
};

export const createPropuesta = async (data: CreatePropuestaRequest): Promise<PropuestaDto> => {
  const response = await apiClient.post<unknown>('/propuestas', data);
  return normalizePropuesta(response.data);
};

export const getMyPropuestas = async (): Promise<PropuestaDto[]> => {
  const response = await apiClient.get<unknown>('/propuestas/mis-propuestas');
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(normalizePropuesta);
};

export const deletePropuesta = async (id: string): Promise<void> => {
  await apiClient.delete(`/propuestas/${id}`);
};
