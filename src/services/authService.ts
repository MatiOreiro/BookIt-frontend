import apiClient from '../api/axiosClient';
import type {
  AuthResponse,
  LoginRequest,
  RegisterUserRequest,
} from '../types/auth';

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const registerUser = async (
  data: RegisterUserRequest,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('token');
};
