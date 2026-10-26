export interface AccessoryResponse {
  id: string;
  name: string;
  price: number;
}

export interface CartResponse {
  variantId: string;
  model: string;
  color: string;
  memory: string;
  cashPrice: number;
  accessories: AccessoryResponse[];
  suggestedAccessories: AccessoryResponse[];
  voucherCode: string | null;
  subtotal: number;
}

export interface UpdateCartRequest {
  variantId: string;
  accessoryIds: string[];
  voucherCode: string | null;
}

export interface PickupOption {
  branch: string;
  name: string;
}

export interface ShippingOption {
  postalCode: string | null;
  available: boolean;
  cost: number;
}

export interface DeliveryOptionsResponse {
  pickupBranches: PickupOption[];
  shipping: ShippingOption;
}

export interface ReserveUnitRequest {
  variantId: string;
  branch: string;
}

export interface ReservationResponse {
  id: string;
  variantId: string;
  branch: string;
  expiresAt: string;
}

export interface PlaceOrderRequest {
  reservationId: string;
  fullName: string;
  dni: string;
  email: string;
  invoiceType: string;
  cuit: string | null;
  deliveryMethod: string;
  address: string | null;
  postalCode: string | null;
  paymentMethod: string;
  paymentToken: string | null;
  installments: number;
}

export interface OnlineOrderResponse {
  id: string;
  variantId: string;
  status: string;
  invoiceType: string;
  deliveryMethod: string;
  branch: string;
  paymentMethod: string;
  devicePrice: number;
  accessoriesTotal: number;
  shippingCost: number;
  tradeInDiscount: number;
  total: number;
  createdAt: string;
  transferDeadline: string | null;
}
