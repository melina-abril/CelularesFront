import { AdvanceOrderStatusRequest, OrderFilters, OrderPageResponse, OrderResponse, OrderStatus } from '../models/orders.models';

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

// Datos de demostración: se reemplazan al conectar el backend.
const orders: OrderResponse[] = [
  { id: 'PED-1042', model: 'Samsung Galaxy A55', variant: 'Azul · 128 GB', total: 689999, branch: 'CENTRO', deliveryMethod: 'RETIRO', paymentMethod: 'TRANSFERENCIA', status: 'PENDIENTE_PAGO', createdAt: hoursFromNow(-45), deliveredAt: null, imei: null, transferExpiresAt: hoursFromNow(3), transferExpiringSoon: true, returnDeadline: null, withinReturnPeriod: false, nextStatuses: ['PAGADO', 'CANCELADO'] },
  { id: 'PED-1043', model: 'Motorola Edge 50', variant: 'Negro · 256 GB', total: 829900, branch: 'CENTRO', deliveryMethod: 'ENVIO', paymentMethod: 'TARJETA', status: 'PAGADO', createdAt: hoursFromNow(-12), deliveredAt: null, imei: null, transferExpiresAt: null, transferExpiringSoon: false, returnDeadline: null, withinReturnPeriod: false, nextStatuses: ['PREPARADO', 'CANCELADO'] },
  { id: 'PED-1044', model: 'iPhone 15', variant: 'Rosa · 128 GB', total: 1799900, branch: 'NORTE', deliveryMethod: 'ENVIO', paymentMethod: 'TARJETA', status: 'PREPARADO', createdAt: hoursFromNow(-36), deliveredAt: null, imei: '359876543210123', transferExpiresAt: null, transferExpiringSoon: false, returnDeadline: null, withinReturnPeriod: false, nextStatuses: ['DESPACHADO'] },
  { id: 'PED-1045', model: 'Samsung Galaxy S24', variant: 'Gris · 256 GB', total: 1430000, branch: 'SUR', deliveryMethod: 'RETIRO', paymentMethod: 'TARJETA', status: 'LISTO_PARA_RETIRAR', createdAt: hoursFromNow(-28), deliveredAt: null, imei: '353456789012345', transferExpiresAt: null, transferExpiringSoon: false, returnDeadline: null, withinReturnPeriod: false, nextStatuses: ['ENTREGADO'] },
  { id: 'PED-1046', model: 'Motorola G84', variant: 'Verde · 256 GB', total: 475000, branch: 'CENTRO', deliveryMethod: 'ENVIO', paymentMethod: 'TARJETA', status: 'ENTREGADO', createdAt: hoursFromNow(-96), deliveredAt: hoursFromNow(-24), imei: '352345678901234', transferExpiresAt: null, transferExpiringSoon: false, returnDeadline: hoursFromNow(216), withinReturnPeriod: true, nextStatuses: ['DEVUELTO'] },
  { id: 'PED-1047', model: 'Samsung Galaxy A35', variant: 'Negro · 128 GB', total: 549000, branch: 'CENTRO', deliveryMethod: 'RETIRO', paymentMethod: 'TRANSFERENCIA', status: 'CANCELADO', createdAt: hoursFromNow(-72), deliveredAt: null, imei: null, transferExpiresAt: hoursFromNow(-24), transferExpiringSoon: false, returnDeadline: null, withinReturnPeriod: false, nextStatuses: [] }
];

export function mockListOrders(filters: OrderFilters): OrderPageResponse {
  const from = filters.from ? Date.parse(filters.from) : null;
  const to = filters.to ? Date.parse(filters.to) : null;
  const matches = orders.filter(order =>
    (!filters.status || order.status === filters.status) &&
    (!filters.branch || order.branch === filters.branch) &&
    (!filters.paymentMethod || order.paymentMethod === filters.paymentMethod) &&
    (from === null || Date.parse(order.createdAt) >= from) &&
    (to === null || Date.parse(order.createdAt) <= to)
  );
  return { items: matches.slice(filters.page * filters.size, (filters.page + 1) * filters.size).map(order => ({ ...order, nextStatuses: [...order.nextStatuses] })), page: filters.page, size: filters.size, total: matches.length };
}

export function mockGetOrder(id: string): OrderResponse | undefined {
  const order = orders.find(item => item.id === id);
  return order ? { ...order, nextStatuses: [...order.nextStatuses] } : undefined;
}

export function mockAdvanceOrderStatus(id: string, request: AdvanceOrderStatusRequest): OrderResponse | undefined {
  const order = orders.find(item => item.id === id);
  if (!order || !order.nextStatuses.includes(request.status)) return undefined;
  const next: Record<OrderStatus, OrderStatus[]> = {
    PENDIENTE_PAGO: ['PAGADO', 'CANCELADO'], PAGADO: ['PREPARADO', 'CANCELADO'],
    PREPARADO: order.deliveryMethod === 'ENVIO' ? ['DESPACHADO'] : ['LISTO_PARA_RETIRAR'],
    DESPACHADO: ['ENTREGADO'], LISTO_PARA_RETIRAR: ['ENTREGADO'],
    ENTREGADO: ['DEVUELTO'], CANCELADO: [], DEVUELTO: []
  };
  order.status = request.status;
  if (request.status === 'PREPARADO') order.imei = request.imei;
  if (request.status === 'ENTREGADO') {
    order.deliveredAt = new Date().toISOString();
    order.returnDeadline = hoursFromNow(240);
    order.withinReturnPeriod = true;
  }
  if (request.status === 'DEVUELTO') order.withinReturnPeriod = false;
  order.nextStatuses = next[request.status];
  return { ...order, nextStatuses: [...order.nextStatuses] };
}
