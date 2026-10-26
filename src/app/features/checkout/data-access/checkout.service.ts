import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { environment } from '../../../../environments/environment';
import { CartResponse, DeliveryOptionsResponse, OnlineOrderResponse, PlaceOrderRequest, ReservationResponse, ReserveUnitRequest, UpdateCartRequest } from '../models/checkout.models';
import { MOCK_CART, mockDeliveryOptions, mockOnlineOrder, mockReservation, mockUpdatedCart } from './checkout.mock';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private cart: CartResponse = { ...MOCK_CART };
  private reservation: ReservationResponse | null = null;

  getCart(): Observable<CartResponse> {
    return environment.useMock ? mockResponse(this.cart) : this.http.get<CartResponse>(apiUrl('/api/v1/checkout/cart'));
  }

  updateCart(request: UpdateCartRequest): Observable<CartResponse> {
    if (!environment.useMock) return this.http.put<CartResponse>(apiUrl('/api/v1/checkout/cart'), request);
    if (request.voucherCode === 'INVALIDO') return mockError(422, 'El vale de canje no es válido o venció.');
    this.cart = mockUpdatedCart(request);
    this.reservation = null;
    return mockResponse(this.cart);
  }

  getDeliveryOptions(postalCode: string | null = null): Observable<DeliveryOptionsResponse> {
    if (environment.useMock) return mockResponse(mockDeliveryOptions(postalCode));
    return this.http.get<DeliveryOptionsResponse>(apiUrl('/api/v1/checkout/delivery-options'), {
      params: postalCode ? { postalCode } : {}
    });
  }

  reserveUnit(request: ReserveUnitRequest): Observable<ReservationResponse> {
    if (!environment.useMock) return this.http.post<ReservationResponse>(apiUrl('/api/v1/checkout/reservations'), request);
    if (request.variantId !== this.cart.variantId || !mockDeliveryOptions(null).pickupBranches.some(item => item.branch === request.branch)) {
      return mockError(409, 'La unidad ya no está disponible en la sucursal seleccionada.');
    }
    this.reservation = mockReservation(request);
    return mockResponse(this.reservation);
  }

  placeOnlineOrder(request: PlaceOrderRequest): Observable<OnlineOrderResponse> {
    if (!environment.useMock) return this.http.post<OnlineOrderResponse>(apiUrl('/api/v1/checkout/orders'), request);
    if (!this.reservation || request.reservationId !== this.reservation.id || Date.parse(this.reservation.expiresAt) <= Date.now()) {
      return mockError(409, 'La reserva venció. Volvé a comprobar la disponibilidad.');
    }
    if ((request.invoiceType === 'A' && !request.cuit) || (request.deliveryMethod === 'ENVIO' && (!request.address || !request.postalCode)) || (request.paymentMethod === 'TARJETA' && !request.paymentToken)) {
      return mockError(422, 'Revisá los datos fiscales, de entrega y de pago.');
    }
    const shippingCost = request.deliveryMethod === 'ENVIO' ? mockDeliveryOptions(request.postalCode).shipping.cost : 0;
    const order = mockOnlineOrder(request, this.cart, this.reservation, shippingCost);
    this.reservation = null;
    return mockResponse(order);
  }
}
