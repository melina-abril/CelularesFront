import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { environment } from '../../../../environments/environment';
import { AdvanceOrderStatusRequest, OrderFilters, OrderPageResponse, OrderResponse } from '../models/orders.models';
import { mockAdvanceOrderStatus, mockGetOrder, mockListOrders } from './orders.mock';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly path = '/api/v1/orders';

  listOrders(filters: OrderFilters): Observable<OrderPageResponse> {
    if (environment.useMock) return mockResponse(mockListOrders(filters));
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.branch) params = params.set('branch', filters.branch);
    if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<OrderPageResponse>(apiUrl(this.path), { params });
  }

  getOrder(orderId: string): Observable<OrderResponse> {
    if (environment.useMock) {
      const order = mockGetOrder(orderId);
      return order ? mockResponse(order) : mockError(404, 'No se encontró el pedido.');
    }
    return this.http.get<OrderResponse>(apiUrl(`${this.path}/${encodeURIComponent(orderId)}`));
  }

  advanceOrderStatus(orderId: string, request: AdvanceOrderStatusRequest): Observable<OrderResponse> {
    if (environment.useMock) {
      const order = mockGetOrder(orderId);
      if (!order) return mockError(404, 'No se encontró el pedido.');
      if (!order.nextStatuses.includes(request.status)) return mockError(422, 'La transición solicitada no es válida para este pedido.');
      if (request.status === 'PREPARADO' && (!request.imei || !/^\d{15}$/.test(request.imei))) {
        return mockError(422, 'Para preparar el pedido, ingresá un IMEI válido de 15 dígitos.');
      }
      if (request.imei && order.imei && request.status === 'PREPARADO') {
        return mockError(409, 'La unidad ya está reservada para otro pedido.');
      }
      const updated = mockAdvanceOrderStatus(orderId, request);
      return updated ? mockResponse(updated) : mockError(409, 'El pedido cambió de estado. Volvé a consultar el detalle.');
    }
    return this.http.patch<OrderResponse>(apiUrl(`${this.path}/${encodeURIComponent(orderId)}/status`), request);
  }
}
