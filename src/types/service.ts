export interface RegisterServiceRequest {
  Nombre: string;
  DescripcionServicio: string;
  PrecioMinimo: number;
  PrecioMaximo: number;
  TipoServicio: string;
  CategoryIds?: string[];
}

export interface EventCategoryDto {
  id: string;
  nombre: string;
}

export interface VendorDto {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
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
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  vendor?: VendorDto;
  categorias?: EventCategoryDto[];
}

export interface ServiceFilters {
  searchTerm?: string;
  location?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  tipoServicio?: string;
  categoryIds?: string[];
}
