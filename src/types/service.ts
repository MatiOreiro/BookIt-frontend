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
  DiasAtencion?: number[];
  HoraAperturaReserva?: number;
  HoraCierreReserva?: number;
  HoraAperturaVisita?: number;
  HoraCierreVisita?: number;
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

export interface PagoDto {
  id: string;
  reservaId: string;
  tipoPago: 'Seña' | 'Parcial' | 'Total';
  importe: number;
  fechaPago: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreatePagoRequest {
  reservaId: string;
  tipoPago: string;
  importe: number;
  fechaPago: string;
}

export interface UpdatePagoRequest {
  tipoPago: string;
  importe: number;
  fechaPago: string;
}

export interface ConfirmarReservaRequest {
  horasReservadas: number;
  montoAcordado: number;
}

export interface ReservationDto {
  id: string;
  serviceId: string;
  userId: string;
  confirmada: boolean;
  fechaReservaCliente: string;
  usuario?: ReservationUserDto | null;
  montoAcordado?: number | null;
  horasReservadas?: number | null;
  pagos?: PagoDto[];
  serviceNombre?: string | null;
  precioMinimo?: number | null;
  precioMaximo?: number | null;
  vendorNombre?: string | null;
  vendorEmail?: string | null;
  vendorTelefono?: string | null;
}

export interface VisitDto {
  id: string;
  serviceId: string;
  serviceNombre?: string | null;
  userId: string;
  userNombre?: string | null;
  userEmail?: string | null;
  fechaHoraSolicitada: string;
  estado: string;
  mensaje?: string | null;
  fechaCreacion: string;
  vendorNombre?: string | null;
  vendorEmail?: string | null;
  vendorTelefono?: string | null;
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

export interface ServicioAsociadoDto {
  id: string;
  nombre: string;
  tipoServicio: string;
  precioMinimo: number;
  precioMaximo: number;
  descripcion: string;
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
  serviciosAsociados?: ServicioAsociadoDto[];
  diasAtencion?: number[] | null;
  horaAperturaReserva?: number | null;
  horaCierreReserva?: number | null;
  horaAperturaVisita?: number | null;
  horaCierreVisita?: number | null;
}

export interface ServiceFilters {
  searchTerm?: string;
  location?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  tipoServicio?: string;
  categoryIds?: string[];
}

export interface ConfirmVisitReservationData {
  fechaReservaCliente: string;
  horasReservadas: number;
  montoAcordado: number;
}
