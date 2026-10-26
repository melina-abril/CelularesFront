export type Condicion = 'NUEVO' | 'REACONDICIONADO';
export type Sucursal = 'PALERMO' | 'BELGRANO' | 'CABALLITO' | 'RECOLETA' | 'MICROCENTRO' | 'SAN_ISIDRO' | 'LA_PLATA';

export const SUCURSALES: readonly { value: Sucursal; label: string }[] = [
  { value: 'PALERMO', label: 'Palermo' },
  { value: 'BELGRANO', label: 'Belgrano' },
  { value: 'CABALLITO', label: 'Caballito' },
  { value: 'RECOLETA', label: 'Recoleta' },
  { value: 'MICROCENTRO', label: 'Microcentro' },
  { value: 'SAN_ISIDRO', label: 'San Isidro' },
  { value: 'LA_PLATA', label: 'La Plata' }
];

export interface CatalogoFiltro {
  marca: string | null;
  precioMinimo: number | null;
  precioMaximo: number | null;
  memoriaGb: number | null;
  condicion: Condicion | null;
  sucursal: Sucursal | null;
  page: number;
  size: number;
}

export interface ModeloResumenResponse {
  modeloId: string;
  marca: string;
  modelo: string;
  condicion: Condicion;
  grado: string | null;
  fotoUrl: string;
  sku: string;
  color: string;
  memoriaGb: number;
  precioContado: number;
  cuotaMasBaja: number | null;
  cantidadCuotas: number | null;
  estadoStock: string;
  sucursalesConStock: number;
  cantidadTotal: number | null;
}

export interface CatalogoPageResponse {
  content: ModeloResumenResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DisponibilidadResponse {
  sucursal: Sucursal;
  disponible: boolean;
  cantidad: number | null;
}

export interface VarianteDetalle {
  sku: string;
  color: string;
  memoriaGb: number;
  precioContado: number;
  cuotaMasBaja: number | null;
  cantidadCuotas: number | null;
  estadoStock: string;
  sucursales: DisponibilidadResponse[];
}

export interface ModeloDetalleResponse {
  modeloId: string;
  marca: string;
  modelo: string;
  condicion: Condicion;
  grado: string | null;
  fotoUrl: string;
  variantes: VarianteDetalle[];
}

export interface CrearAvisoRequest {
  modeloId: string;
  sku: string;
  correo: string;
}

export interface AvisoResponse {
  sku: string;
  correo: string;
  mensaje: string;
}
