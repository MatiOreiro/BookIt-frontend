import apiClient from '../api/axiosClient';
import axios from 'axios';

interface BackendCatalogItem {
  Id?: string;
  id?: string;
  Nombre?: string;
  nombre?: string;
  FechaCreacion?: string;
  fechaCreacion?: string;
}

export interface CatalogOption {
  id: string;
  name: string;
}

const normalizeCatalogItem = (item: BackendCatalogItem): CatalogOption => ({
  id: item.Id ?? item.id ?? '',
  name: item.Nombre ?? item.nombre ?? '',
});

export const getEventCategories = async (): Promise<CatalogOption[]> => {
  try {
    const response = await apiClient.get<BackendCatalogItem[]>('/event-categories');
    return response.data.map(normalizeCatalogItem);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('getEventCategories failed', err.response?.status, err.response?.data);
    } else {
      console.error('getEventCategories failed', err);
    }
    return [];
  }
};

export const getTags = async (): Promise<CatalogOption[]> => {
  try {
    const response = await apiClient.get<BackendCatalogItem[]>('/tags');
    return response.data.map(normalizeCatalogItem);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('getTags failed', err.response?.status, err.response?.data);
    } else {
      console.error('getTags failed', err);
    }
    return [];
  }
};