import apiClient from '../api/axiosClient';
import type {
  AuthResponse,
  LoginRequest,
  RegisterVendorRequest,
  RegisterUserRequest,
  User,
} from '../types/auth';

interface BackendUser {
  Id?: string;
  id?: string;
  Nombre?: string;
  nombre?: string;
  Telefono?: string;
  telefono?: string;
  Email?: string;
  email?: string;
  Rol?: string;
  rol?: string;
  Activo?: boolean;
  FechaCreacion?: string;
  FechaActualizacion?: string;
}

interface BackendAuthResponse {
  token: string;
  user: BackendUser;
}

const normalizeUser = (user: BackendUser): User => ({
  id: user.Id ?? user.id ?? '',
  name: user.Nombre ?? user.nombre ?? '',
  email: user.Email ?? user.email ?? '',
  role: (user.Rol ?? user.rol ?? '').toLowerCase(),
});

const normalizeAuthResponse = (response: BackendAuthResponse): AuthResponse => ({
  token: response.token,
  user: normalizeUser(response.user),
});

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<BackendAuthResponse>('/auth/login', data);
  return normalizeAuthResponse(response.data);
};

export const registerUser = async (
  data: RegisterUserRequest,
): Promise<AuthResponse> => {
  const response = await apiClient.post<BackendAuthResponse>('/auth/register', data);
  return normalizeAuthResponse(response.data);
};

export const registerVendor = async (
  data: RegisterVendorRequest,
): Promise<AuthResponse> => {
  const response = await apiClient.post<BackendAuthResponse>('/auth/register-vendor', data);
  return normalizeAuthResponse(response.data);
};

export const logout = (): void => {
  localStorage.removeItem('token');
};
