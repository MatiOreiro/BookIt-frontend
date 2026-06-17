// BookIt-frontend/src/services/pagoService.ts
import apiClient from '../api/axiosClient';
import type { CreatePagoRequest, PagoDto, UpdatePagoRequest } from '../types/service';

const pickString = (value: unknown): string => (typeof value === 'string' ? value : '');
const pickNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

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

export const createPago = async (data: CreatePagoRequest): Promise<PagoDto> => {
  const response = await apiClient.post<unknown>('/pagos', {
    ReservaId: data.reservaId,
    TipoPago: data.tipoPago,
    Importe: data.importe,
    FechaPago: data.fechaPago,
  });
  return normalizePago(response.data);
};

export const updatePago = async (id: string, data: UpdatePagoRequest): Promise<PagoDto> => {
  const response = await apiClient.put<unknown>(`/pagos/${id}`, {
    TipoPago: data.tipoPago,
    Importe: data.importe,
    FechaPago: data.fechaPago,
  });
  return normalizePago(response.data);
};

export const getPagosByReserva = async (reservaId: string): Promise<PagoDto[]> => {
  const response = await apiClient.get<unknown>(`/pagos/reserva/${reservaId}`);
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(normalizePago);
};
