import apiClient from '../api/axiosClient';

export interface DepartamentoOption {
  id: string;
  nombre: string;
}

export interface BarrioOption {
  id: string;
  departamentoId: string;
  nombre: string;
}

interface DepartamentoResponse {
  Id?: string;
  id?: string;
  Nombre?: string;
  nombre?: string;
}

interface BarrioResponse {
  Id?: string;
  id?: string;
  DepartamentoId?: string;
  departamentoId?: string;
  Nombre?: string;
  nombre?: string;
}

const normalizeDepartamento = (item: DepartamentoResponse): DepartamentoOption => ({
  id: item.Id ?? item.id ?? '',
  nombre: item.Nombre ?? item.nombre ?? '',
});

const normalizeBarrio = (item: BarrioResponse): BarrioOption => ({
  id: item.Id ?? item.id ?? '',
  departamentoId: item.DepartamentoId ?? item.departamentoId ?? '',
  nombre: item.Nombre ?? item.nombre ?? '',
});

export const getDepartamentos = async (): Promise<DepartamentoOption[]> => {
  const response = await apiClient.get<DepartamentoResponse[]>('/departamentos');
  return response.data.map(normalizeDepartamento);
};

export const getBarriosByDepartamento = async (departamentoId: string): Promise<BarrioOption[]> => {
  const response = await apiClient.get<BarrioResponse[]>(`/departamentos/${departamentoId}/barrios`);
  return response.data.map(normalizeBarrio);
};
