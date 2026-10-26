import { AvisoResponse, CatalogoFiltro, CatalogoPageResponse, Condicion, CrearAvisoRequest, DisponibilidadResponse, ModeloDetalleResponse, ModeloResumenResponse, SUCURSALES, Sucursal, VarianteDetalle } from '../models/catalogo.models';

const photo = '/catalogo-phone.svg';
const quantities: Record<string, Partial<Record<Sucursal, number>>> = {
  'GAL-A55-128-AZ': { PALERMO: 2, BELGRANO: 4, CABALLITO: 1, RECOLETA: 2, MICROCENTRO: 3, SAN_ISIDRO: 1, LA_PLATA: 2 },
  'GAL-A55-256-NE': { BELGRANO: 1, LA_PLATA: 1 },
  'IPH-13-128-NE': { PALERMO: 1, RECOLETA: 1, SAN_ISIDRO: 1 },
  'MOTO-G84-256-AZ': {},
  'GAL-S23-256-CR': { CABALLITO: 2, MICROCENTRO: 1, LA_PLATA: 2 }
};

type MockVariant = Omit<VarianteDetalle, 'sucursales' | 'estadoStock'>;
interface MockModel {
  modeloId: string;
  marca: string;
  modelo: string;
  condicion: Condicion;
  grado: string | null;
  fotoUrl: string;
  variantes: MockVariant[];
}

const models: MockModel[] = [
  { modeloId: 'galaxy-a55', marca: 'Samsung', modelo: 'Galaxy A55', condicion: 'NUEVO', grado: null, fotoUrl: photo, variantes: [
    { sku: 'GAL-A55-128-AZ', color: 'Azul', memoriaGb: 128, precioContado: 649999, cuotaMasBaja: 108333.17, cantidadCuotas: 6 },
    { sku: 'GAL-A55-256-NE', color: 'Negro', memoriaGb: 256, precioContado: 739999, cuotaMasBaja: 123333.17, cantidadCuotas: 6 }
  ] },
  { modeloId: 'iphone-13', marca: 'Apple', modelo: 'iPhone 13', condicion: 'REACONDICIONADO', grado: 'A', fotoUrl: photo, variantes: [
    { sku: 'IPH-13-128-NE', color: 'Negro', memoriaGb: 128, precioContado: 899999, cuotaMasBaja: null, cantidadCuotas: null }
  ] },
  { modeloId: 'moto-g84', marca: 'Motorola', modelo: 'Moto G84', condicion: 'NUEVO', grado: null, fotoUrl: photo, variantes: [
    { sku: 'MOTO-G84-256-AZ', color: 'Azul', memoriaGb: 256, precioContado: 459999, cuotaMasBaja: null, cantidadCuotas: null }
  ] },
  { modeloId: 'galaxy-s23', marca: 'Samsung', modelo: 'Galaxy S23', condicion: 'REACONDICIONADO', grado: 'B', fotoUrl: photo, variantes: [
    { sku: 'GAL-S23-256-CR', color: 'Crema', memoriaGb: 256, precioContado: 999999, cuotaMasBaja: 166666.5, cantidadCuotas: 6 }
  ] }
];

export const CATALOGO_BRANDS: readonly string[] = [...new Set(models.map(model => model.marca))].sort();
export const CATALOGO_MEMORIES: readonly number[] = [...new Set(models.flatMap(model => model.variantes.map(variant => variant.memoriaGb)))].sort((a, b) => a - b);

function available(sku: string, branch: Sucursal): number {
  return quantities[sku]?.[branch] ?? 0;
}

function total(sku: string): number {
  return SUCURSALES.reduce((sum, branch) => sum + available(sku, branch.value), 0);
}

function status(sku: string): string {
  const count = total(sku);
  return count === 0 ? 'SIN_STOCK' : count <= 3 ? 'ULTIMAS_UNIDADES' : 'EN_STOCK';
}

export function mockListModels(filter: CatalogoFiltro, showQuantities: boolean): CatalogoPageResponse {
  const matching: ModeloResumenResponse[] = models.flatMap(model => model.variantes
    .filter(variant => (!filter.marca || model.marca === filter.marca)
      && (filter.precioMinimo === null || variant.precioContado >= filter.precioMinimo)
      && (filter.precioMaximo === null || variant.precioContado <= filter.precioMaximo)
      && (filter.memoriaGb === null || variant.memoriaGb === filter.memoriaGb)
      && (!filter.condicion || model.condicion === filter.condicion)
      && (!filter.sucursal || available(variant.sku, filter.sucursal) > 0))
    .map(variant => ({
      modeloId: model.modeloId, marca: model.marca, modelo: model.modelo, condicion: model.condicion,
      grado: model.grado, fotoUrl: model.fotoUrl, sku: variant.sku, color: variant.color,
      memoriaGb: variant.memoriaGb, precioContado: variant.precioContado,
      cuotaMasBaja: variant.cuotaMasBaja, cantidadCuotas: variant.cantidadCuotas,
      estadoStock: status(variant.sku), sucursalesConStock: SUCURSALES.filter(branch => available(variant.sku, branch.value) > 0).length,
      cantidadTotal: showQuantities ? total(variant.sku) : null
    })));
  const size = Math.max(1, filter.size);
  return { content: matching.slice(filter.page * size, (filter.page + 1) * size), page: filter.page, size, totalElements: matching.length, totalPages: Math.ceil(matching.length / size) };
}

export function mockModelDetail(modeloId: string, showQuantities: boolean): ModeloDetalleResponse | null {
  const model = models.find(item => item.modeloId === modeloId);
  if (!model) return null;
  return {
    modeloId: model.modeloId, marca: model.marca, modelo: model.modelo, condicion: model.condicion,
    grado: model.grado, fotoUrl: model.fotoUrl,
    variantes: model.variantes.map(variant => ({
      ...variant, estadoStock: status(variant.sku),
      sucursales: SUCURSALES.map(branch => {
        const count = available(variant.sku, branch.value);
        const entry: DisponibilidadResponse = { sucursal: branch.value, disponible: count > 0, cantidad: showQuantities ? count : null };
        return entry;
      })
    }))
  };
}

export function mockCreateStockAlert(request: CrearAvisoRequest): AvisoResponse | null {
  const model = models.find(item => item.modeloId === request.modeloId);
  if (!model?.variantes.some(variant => variant.sku === request.sku) || total(request.sku) > 0) return null;
  return { sku: request.sku, correo: request.correo, mensaje: 'Aviso creado para esta variante' };
}
