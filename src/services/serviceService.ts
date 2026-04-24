import apiClient from '../api/axiosClient';
import type { RegisterServiceRequest, Service } from '../types/service';

export const registerService = async (
  data: RegisterServiceRequest,
): Promise<Service> => {
  const response = await apiClient.post<Service>('/services', data);
  return response.data;
};

export const getServices = async (): Promise<Service[]> => {
  const response = await apiClient.get<Service[]>('/services');
  return response.data;
};
