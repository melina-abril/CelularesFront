import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { environment } from '../../../../environments/environment';
import { MOCK_CUSTOMER, MOCK_IMEI, mockApproval } from './counter-sales.mock';
import { ApprovalRequest, ApprovalResolution, ApprovalResponse, CustomerRequest, CustomerResponse, ImeiRequest, ImeiResponse, SaleRequest, SaleResponse } from '../models/counter-sales.models';

const ROOT = '/api/v1/counter-sales';

@Injectable({ providedIn: 'root' })
export class CounterSalesService {
  private readonly http = inject(HttpClient);
  private customer: CustomerResponse = MOCK_CUSTOMER;
  private approval: ApprovalResponse | null = null;

  findCustomerByDni(dni: string): Observable<CustomerResponse> {
    if (environment.useMock) {
      return dni === this.customer.dni ? mockResponse(this.customer) : mockError(404, 'No se encontró un cliente con ese DNI.');
    }
    return this.http.get<CustomerResponse>(apiUrl(`${ROOT}/customers`), { params: { dni } });
  }

  createCustomer(request: CustomerRequest): Observable<CustomerResponse> {
    if (environment.useMock) {
      if (!/^[0-9]{7,8}$/.test(request.dni) || (request.registeredTaxpayer && !request.cuit)) {
        return mockError(422, 'Revisá el DNI y el CUIT requerido para factura A.');
      }
      this.customer = { ...request };
      return mockResponse(this.customer);
    }
    return this.http.post<CustomerResponse>(apiUrl(`${ROOT}/customers`), request);
  }

  verifySaleImei(request: ImeiRequest): Observable<ImeiResponse> {
    if (environment.useMock) {
      return request.imei === MOCK_IMEI.imei
        ? mockResponse({ ...MOCK_IMEI })
        : mockError(409, 'El IMEI no está disponible en esta sucursal o ya está reservado.');
    }
    return this.http.post<ImeiResponse>(apiUrl(`${ROOT}/imei-verifications`), request);
  }

  requestDiscountApproval(request: ApprovalRequest): Observable<ApprovalResponse> {
    if (environment.useMock) {
      if (request.percent <= 5 || request.percent > 100 || request.imei !== MOCK_IMEI.imei) {
        return mockError(422, 'La propuesta de descuento o el IMEI no son válidos.');
      }
      this.approval = mockApproval(request.imei, request.percent);
      return mockResponse(this.approval);
    }
    return this.http.post<ApprovalResponse>(apiUrl(`${ROOT}/discount-approvals`), request);
  }

  resolveDiscountApproval(approvalId: string, request: ApprovalResolution): Observable<ApprovalResponse> {
    if (environment.useMock) {
      if (!this.approval || this.approval.id !== approvalId) {
        return mockError(404, 'No se encontró la solicitud de aprobación.');
      }
      this.approval = { ...this.approval, approved: request.approved, rejected: !request.approved };
      return mockResponse(this.approval);
    }
    return this.http.patch<ApprovalResponse>(apiUrl(`${ROOT}/discount-approvals/${encodeURIComponent(approvalId)}`), request);
  }

  createCounterSale(request: SaleRequest): Observable<SaleResponse> {
    if (environment.useMock) {
      if (request.imei !== MOCK_IMEI.imei) {
        return mockError(409, 'La unidad ya no está disponible para la venta.');
      }
      if (request.discountPercent > 5 && (!this.approval?.approved || this.approval.id !== request.approvalId || this.approval.imei !== request.imei || this.approval.percent !== request.discountPercent)) {
        return mockError(422, 'El descuento requiere aprobación vigente del supervisor.');
      }
      if (request.paymentTotal <= 0 || (request.paymentMethod === 'CREDIT' && (!request.installments || !request.bank))) {
        return mockError(422, 'Revisá el total y los datos del medio de pago.');
      }
      const response: SaleResponse = {
        id: 'V-10042', invoiceNumber: '0001-00010542',
        invoiceType: this.customer.registeredTaxpayer && this.customer.dni === request.dni ? 'A' : 'B',
        imei: request.imei, dni: request.dni, branch: MOCK_IMEI.branch,
        total: request.paymentTotal, commission: Math.round(request.paymentTotal * 0.02 * 100) / 100,
        createdAt: new Date().toISOString()
      };
      return mockResponse(response);
    }
    return this.http.post<SaleResponse>(apiUrl(`${ROOT}/sales`), request);
  }
}
