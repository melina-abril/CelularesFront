export type OrderStatus = 'PENDIENTE_PAGO' | 'PAGADO' | 'PREPARADO' | 'DESPACHADO' | 'LISTO_PARA_RETIRAR' | 'ENTREGADO' | 'CANCELADO' | 'DEVUELTO';
export type DeliveryMethod = 'RETIRO' | 'ENVIO';
export type PaymentMethod = 'TRANSFERENCIA' | 'TARJETA';

export interface OrderResponse {
  id: string;
  model: string;
  variant: string;
  total: number;
  branch: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  deliveredAt: string | null;
  imei: string | null;
  transferExpiresAt: string | null;
  transferExpiringSoon: boolean;
  returnDeadline: string | null;
  withinReturnPeriod: boolean;
  nextStatuses: OrderStatus[];
}

export interface OrderPageResponse {
  items: OrderResponse[];
  page: number;
  size: number;
  total: number;
}

export interface AdvanceOrderStatusRequest {
  status: OrderStatus;
  imei: string | null;
}

export interface OrderFilters {
  status: OrderStatus | '';
  branch: string;
  paymentMethod: PaymentMethod | '';
  from: string;
  to: string;
  page: number;
  size: number;
}

export const ORDER_STATUSES: readonly OrderStatus[] = ['PENDIENTE_PAGO', 'PAGADO', 'PREPARADO', 'DESPACHADO', 'LISTO_PARA_RETIRAR', 'ENTREGADO', 'CANCELADO', 'DEVUELTO'];

export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PENDIENTE_PAGO: 'Pendiente de pago', PAGADO: 'Pagado', PREPARADO: 'Preparado',
    DESPACHADO: 'Despachado', LISTO_PARA_RETIRAR: 'Listo para retirar',
    ENTREGADO: 'Entregado', CANCELADO: 'Cancelado', DEVUELTO: 'Devuelto'
  };
  return labels[status];
}
