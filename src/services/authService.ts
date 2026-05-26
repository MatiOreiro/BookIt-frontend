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

const appendValue = (formData: FormData, key: string, value: string | number | boolean | File | null | undefined) => {
  if (value instanceof File) {
    formData.append(key, value);
    return;
  }

  if (value === null || value === undefined || value === '') {
    return;
  }

  formData.append(key, String(value));
};

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
  const formData = new FormData();
  appendValue(formData, 'Nombre', data.Nombre);
  appendValue(formData, 'Telefono', data.Telefono);
  appendValue(formData, 'Email', data.Email);
  appendValue(formData, 'Password', data.Password);
  appendValue(formData, 'Rol', data.Rol ?? 'usuario');
  appendValue(formData, 'ProfileImage', data.ProfileImage);

  const response = await apiClient.post<BackendAuthResponse>('/auth/register', formData);
  return normalizeAuthResponse(response.data);
};

export const registerVendor = async (
  data: RegisterVendorRequest,
): Promise<AuthResponse> => {
  const formData = new FormData();
  appendValue(formData, 'Nombre', data.Nombre);
  appendValue(formData, 'Telefono', data.Telefono);
  appendValue(formData, 'Email', data.Email);
  appendValue(formData, 'Password', data.Password);
  appendValue(formData, 'NombreServicio', data.NombreServicio);
  appendValue(formData, 'DescripcionServicio', data.DescripcionServicio);
  appendValue(formData, 'Ubicacion', data.Ubicacion);
  appendValue(formData, 'TipoServicio', data.TipoServicio);
  appendValue(formData, 'PrecioMinimo', data.PrecioMinimo);
  appendValue(formData, 'PrecioMaximo', data.PrecioMaximo);
  appendValue(formData, 'ProfileImage', data.ProfileImage);
  data.CategoryIds?.forEach((categoryId) => appendValue(formData, 'CategoryIds', categoryId));
  data.TagIds?.forEach((tagId) => appendValue(formData, 'TagIds', tagId));
  data.ServiceImages?.forEach((image) => appendValue(formData, 'ServiceImages', image));

  const response = await apiClient.post<BackendAuthResponse>('/auth/register-vendor', formData);
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

export const updateProfileImage = async (profileImage: File): Promise<User> => {
  const formData = new FormData();
  formData.append('ProfileImage', profileImage);

  const response = await apiClient.put<BackendUserResponse>('/users/me/profile-image', formData);
  return normalizeUser(response.data);
};

export const logout = (): void => {
  localStorage.removeItem('token');
};
