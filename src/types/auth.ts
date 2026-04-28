export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterUserRequest {
  Nombre: string;
  Telefono: string;
  Email: string;
  Password: string;
  Rol?: string;
}

export interface RegisterVendorRequest {
  Nombre: string;
  Telefono: string;
  Email: string;
  Password: string;
  NombreServicio: string;
  DescripcionServicio: string;
  Ubicacion: string;
  PrecioMinimo: number;
  PrecioMaximo: number;
}

export interface ChangePasswordRequest {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmNewPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}
