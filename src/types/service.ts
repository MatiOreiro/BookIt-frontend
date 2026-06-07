export interface RegisterServiceRequest {
  Nombre: string;
  Descripcion: string;
  Ubicacion: string;
  PrecioMinimo: number;
  PrecioMaximo: number;
  TipoServicio: string;
  Direccion: {
    DepartamentoId: string;
    BarrioId: string;
    Calle: string;
  };
  CategoryIds?: string[];
  TagIds?: string[];
  Capacidad?: number;
  Images?: string[];
}

export interface CreateVisitaRequest {
  ServiceId: string;
  FechaHoraSolicitada: string;
  Mensaje?: string;
}

export interface CreateReservaRequest {
  ServiceId: string;
  FechaReservaCliente: string;
  Mensaje?: string;
}

export interface EventCategoryDto {
  id: string;
  nombre: string;
}

export interface ReservationUserDto {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ReservationDto {
  id: string;
  serviceId: string;
  userId: string;
  confirmada: boolean;
  fechaReservaCliente: string;
  usuario?: ReservationUserDto | null;
}

export interface VisitDto {
  id: string;
  serviceId: string;
  serviceNombre?: string | null;
  userId: string;
  userNombre?: string | null;
  fechaHoraSolicitada: string;
  estado: string;
  mensaje?: string | null;
  fechaCreacion: string;
}

export interface DepartamentoDto {
  id: string;
  nombre: string;
}

export interface BarrioDto {
  id: string;
  departamentoId: string;
  nombre: string;
  departamento?: DepartamentoDto;
}

export interface DireccionDto {
  id: string;
  calle: string;
  departamento?: DepartamentoDto;
  barrio?: BarrioDto;
}

export interface VendorDto {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  profileImageUrl?: string | null;
}

export interface Service {
  id: string;
  vendorId: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  tipoServicio: string;
  precioMinimo: number;
  precioMaximo: number;
  capacidad?: number | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  vendor?: VendorDto;
  categorias?: EventCategoryDto[];
  reservas?: ReservationDto[];
  visitas?: VisitDto[];
  imagenes?: string[];
  direccion?: DireccionDto | null;
}

export interface ServiceFilters {
  searchTerm?: string;
  location?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  tipoServicio?: string;
  categoryIds?: string[];
}
