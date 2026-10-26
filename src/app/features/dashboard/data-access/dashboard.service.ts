import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { environment } from '../../../../environments/environment';
import { CriticalStockResponse, PagedResponse, SalesMetricsResponse, TopModelResponse, TransferResponse } from '../models/dashboard.models';
import { mockCriticalStock, mockSalesMetrics, mockTopModels, mockTransfers } from './dashboard.mock';

export interface DashboardQuery {
  from?: string;
  to?: string;
  branch?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  private params(query: DashboardQuery): HttpParams {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.branch) params = params.set('branch', query.branch);
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    return params;
  }

  private invalid(query: DashboardQuery): Observable<never> | null {
    if (query.from && query.to && query.from > query.to) {
      return mockError(422, 'La fecha inicial no puede ser posterior a la fecha final.');
    }
    if ((query.page ?? 0) < 0 || (query.size ?? 20) < 1 || (query.size ?? 20) > 50) {
      return mockError(422, 'La página o el tamaño solicitado no es válido.');
    }
    return null;
  }

  getSalesMetrics(query: DashboardQuery): Observable<SalesMetricsResponse> {
    if (environment.useMock) {
      return this.invalid(query) ?? mockResponse(mockSalesMetrics(query.from ?? '2026-01-01', query.to ?? '2026-01-31', query.branch));
    }
    return this.http.get<SalesMetricsResponse>(apiUrl('/api/v1/dashboard/sales'), { params: this.params(query) });
  }

  getTopModels(query: DashboardQuery): Observable<PagedResponse<TopModelResponse>> {
    if (environment.useMock) {
      return this.invalid(query) ?? mockResponse(mockTopModels(query.page ?? 0, query.size ?? 20));
    }
    return this.http.get<PagedResponse<TopModelResponse>>(apiUrl('/api/v1/dashboard/top-models'), { params: this.params(query) });
  }

  getCriticalStock(query: DashboardQuery): Observable<PagedResponse<CriticalStockResponse>> {
    if (environment.useMock) {
      return this.invalid(query) ?? mockResponse(mockCriticalStock(query.branch, query.page ?? 0, query.size ?? 20));
    }
    return this.http.get<PagedResponse<CriticalStockResponse>>(apiUrl('/api/v1/dashboard/critical-stock'), { params: this.params(query) });
  }

  getTransfersInTransit(query: DashboardQuery): Observable<PagedResponse<TransferResponse>> {
    if (environment.useMock) {
      return this.invalid(query) ?? mockResponse(mockTransfers(query.branch, query.page ?? 0, query.size ?? 20));
    }
    return this.http.get<PagedResponse<TransferResponse>>(apiUrl('/api/v1/dashboard/transfers'), { params: this.params(query) });
  }
}
