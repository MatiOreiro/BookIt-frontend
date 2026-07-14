import apiClient from '../api/axiosClient';
import type { CreateResenaRequest, ResenaDto } from '../types/service';

const pickString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const pickNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const getArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const normalizeResena = (raw: unknown): ResenaDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    reservaId: pickString(item.reservaId ?? item.ReservaId),
    serviceId: pickString(item.serviceId ?? item.ServiceId),
    userId: pickString(item.userId ?? item.UserId),
    puntuacion: pickNumber(item.puntuacion ?? item.Puntuacion),
    comentario: pickString(item.comentario ?? item.Comentario) || null,
    mediaUrls: getArray(item.mediaUrls ?? item.MediaUrls).map((url) => pickString(url)).filter(Boolean),
    fechaCreacion: pickString(item.fechaCreacion ?? item.FechaCreacion),
    fechaActualizacion: pickString(item.fechaActualizacion ?? item.FechaActualizacion),
    usuarioNombre: pickString(item.usuarioNombre ?? item.UsuarioNombre) || null,
    usuarioProfileImageUrl: pickString(item.usuarioProfileImageUrl ?? item.UsuarioProfileImageUrl) || null,
  };
};

export const createResena = async (data: CreateResenaRequest): Promise<ResenaDto> => {
  const response = await apiClient.post<unknown>('/resenas', data);
  return normalizeResena(response.data);
};

export const getResenasByServiceId = async (serviceId: string): Promise<ResenaDto[]> => {
  const response = await apiClient.get<unknown>(`/resenas/service/${serviceId}`);
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(normalizeResena);
};
