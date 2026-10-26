import { CartResponse, DeliveryOptionsResponse, OnlineOrderResponse, PlaceOrderRequest, ReservationResponse, ReserveUnitRequest, UpdateCartRequest } from '../models/checkout.models';

// Datos mock a reemplazar al conectar el backend.
export const MOCK_CART: CartResponse = {
  variantId: 'galaxy-a55-128-azul', model: 'Samsung Galaxy A55', color: 'Azul', memory: '128 GB',
  cashPrice: 649999, accessories: [],
  suggestedAccessories: [
    { id: 'funda-a55', name: 'Funda protectora', price: 18990 },
    { id: 'cargador-25w', name: 'Cargador 25 W', price: 34990 }
  ],
  voucherCode: null, subtotal: 649999
};

export function mockUpdatedCart(request: UpdateCartRequest): CartResponse {
  const accessories = MOCK_CART.suggestedAccessories.filter(item => request.accessoryIds.includes(item.id));
  return {
    ...MOCK_CART,
    variantId: request.variantId,
    accessories,
    voucherCode: request.voucherCode,
    subtotal: MOCK_CART.cashPrice + accessories.reduce((sum, item) => sum + item.price, 0)
  };
}

export function mockDeliveryOptions(postalCode: string | null): DeliveryOptionsResponse {
  return {
    pickupBranches: [
      { branch: 'CENTRO', name: 'Sucursal Centro' },
      { branch: 'NORTE', name: 'Sucursal Norte' }
    ],
    shipping: { postalCode, available: postalCode !== '0000', cost: 8900 }
  };
}

export function mockReservation(request: ReserveUnitRequest): ReservationResponse {
  return {
    id: 'res-demo-1042', variantId: request.variantId, branch: request.branch,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };
}

export function mockOnlineOrder(request: PlaceOrderRequest, cart: CartResponse, reservation: ReservationResponse, shippingCost: number): OnlineOrderResponse {
  const createdAt = new Date();
  return {
    id: 'PED-2025-1042', variantId: cart.variantId,
    status: request.paymentMethod === 'TRANSFERENCIA' ? 'PENDIENTE_DE_PAGO' : 'PAGADO',
    invoiceType: request.invoiceType, deliveryMethod: request.deliveryMethod, branch: reservation.branch,
    paymentMethod: request.paymentMethod, devicePrice: cart.cashPrice,
    accessoriesTotal: cart.accessories.reduce((sum, item) => sum + item.price, 0),
    shippingCost, tradeInDiscount: 0, total: cart.subtotal + shippingCost,
    createdAt: createdAt.toISOString(),
    transferDeadline: request.paymentMethod === 'TRANSFERENCIA'
      ? new Date(createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString() : null
  };
}
