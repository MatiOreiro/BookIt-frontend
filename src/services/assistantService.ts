import apiClient from '../api/axiosClient';

export interface GeneratedFilters {
  categoryIds: string[] | null;
  tipoServicio: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  departamentoId: string | null;
  barrioId: string | null;
  guests: string | null;
}

const pickString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const pickNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const pickStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const items = value.filter((v): v is string => typeof v === 'string');
  return items.length > 0 ? items : null;
};

const normalizeGeneratedFilters = (raw: unknown): GeneratedFilters => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    categoryIds: pickStringArray(item.categoryIds ?? item.CategoryIds),
    tipoServicio: pickString(item.tipoServicio ?? item.TipoServicio),
    minPrice: pickNumber(item.minPrice ?? item.MinPrice),
    maxPrice: pickNumber(item.maxPrice ?? item.MaxPrice),
    departamentoId: pickString(item.departamentoId ?? item.DepartamentoId),
    barrioId: pickString(item.barrioId ?? item.BarrioId),
    guests: pickString(item.guests ?? item.Guests),
  };
};

export const askAssistant = async (serviceId: string, pregunta: string): Promise<string> => {
  const response = await apiClient.post<unknown>(`/services/${serviceId}/assistant/ask`, { Pregunta: pregunta });
  const item = (response.data ?? {}) as Record<string, unknown>;
  return pickString(item.respuesta ?? item.Respuesta) ?? '';
};

export const generateFilters = async (descripcion: string): Promise<GeneratedFilters> => {
  const response = await apiClient.post<unknown>('/services/filters/generate', { Descripcion: descripcion });
  return normalizeGeneratedFilters(response.data);
};
