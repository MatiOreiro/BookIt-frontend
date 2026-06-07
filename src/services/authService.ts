import apiClient from '../api/axiosClient';
import type {
  AuthResponse,
  ChangePasswordRequest,
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
  ProfileImageUrl?: string;
  profileImageUrl?: string;
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

interface BackendUserResponse {
  Id?: string;
  id?: string;
  Nombre?: string;
  nombre?: string;
  Email?: string;
  email?: string;
  ProfileImageUrl?: string;
  profileImageUrl?: string;
  Rol?: string;
  rol?: string;
}

const normalizeUser = (user: BackendUser): User => ({
  id: user.Id ?? user.id ?? '',
  name: user.Nombre ?? user.nombre ?? '',
  email: user.Email ?? user.email ?? '',
  role: (user.Rol ?? user.rol ?? '').toLowerCase(),
  profileImageUrl: user.ProfileImageUrl ?? user.profileImageUrl ?? null,
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
  const response = await apiClient.post<BackendAuthResponse>('/auth/register', {
    Nombre: data.Nombre,
    Telefono: data.Telefono,
    Email: data.Email,
    Password: data.Password,
    Rol: data.Rol ?? 'usuario',
    ProfileImageUrl: data.ProfileImageUrl,
  });
  return normalizeAuthResponse(response.data);
};

export const registerVendor = async (
  data: RegisterVendorRequest,
): Promise<AuthResponse> => {
  const response = await apiClient.post<BackendAuthResponse>('/auth/register-vendor', {
    Nombre: data.Nombre,
    Telefono: data.Telefono,
    Email: data.Email,
    Password: data.Password,
    NombreServicio: data.NombreServicio,
    DescripcionServicio: data.DescripcionServicio,
    Ubicacion: data.Ubicacion,
    TipoServicio: data.TipoServicio,
    PrecioMinimo: data.PrecioMinimo,
    PrecioMaximo: data.PrecioMaximo,
    CategoryIds: data.CategoryIds,
    TagIds: data.TagIds,
    ProfileImageUrl: data.ProfileImageUrl,
    ServiceImageUrls: data.ServiceImageUrls,
  });
  return normalizeAuthResponse(response.data);
};

export const changePassword = async (
  data: ChangePasswordRequest,
): Promise<void> => {
  await apiClient.post('/users/me/change-password', data);
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<BackendUserResponse>('/users/me');
  return normalizeUser(response.data);
};

export const updateProfileImage = async (profileImageUrl: string): Promise<User> => {
  const response = await apiClient.put<BackendUserResponse>('/users/me/profile-image', {
    ProfileImageUrl: profileImageUrl,
  });
  return normalizeUser(response.data);
};

export const logout = (): void => {
  localStorage.removeItem('token');
};
