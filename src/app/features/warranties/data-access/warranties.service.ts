import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { environment } from '../../../../environments/environment';
import { ClaimStatus, CreateWarrantyClaimRequest, UpdateWarrantyClaimStatusRequest, WarrantyClaimResponse, WarrantyCoverageResponse } from '../models/warranties.models';
import { MOCK_CLAIM, MOCK_COVERAGE } from './warranties.mock';

@Injectable({ providedIn: 'root' })
export class WarrantiesService {
  private readonly http = inject(HttpClient);
  private readonly mockClaims = new Map<string, WarrantyClaimResponse>([[MOCK_CLAIM.id, MOCK_CLAIM]]);

  findWarrantyCoverage(search: { imei?: string; dni?: string; invoiceNumber?: string }): Observable<WarrantyCoverageResponse> {
    if (environment.useMock) {
      const matches = search.imei === MOCK_COVERAGE.imei || search.dni === '30123456' || search.invoiceNumber === MOCK_COVERAGE.invoiceNumber;
      return matches ? mockResponse(MOCK_COVERAGE) : mockError(404, 'No se encontró una venta para los datos ingresados.');
    }
    let params = new HttpParams();
    if (search.imei) params = params.set('imei', search.imei);
    if (search.dni) params = params.set('dni', search.dni);
    if (search.invoiceNumber) params = params.set('invoiceNumber', search.invoiceNumber);
    return this.http.get<WarrantyCoverageResponse>(apiUrl('/api/v1/warranties/coverage'), { params });
  }

  createWarrantyClaim(request: CreateWarrantyClaimRequest): Observable<WarrantyClaimResponse> {
    if (environment.useMock) {
      if (request.imei !== MOCK_COVERAGE.imei || !MOCK_COVERAGE.covered) {
        return mockError(422, 'El equipo no tiene una garantía vigente.');
      }
      const id = `GAR-${1043 + this.mockClaims.size - 1}`;
      const now = new Date().toISOString();
      const claim: WarrantyClaimResponse = {
        id,
        imei: request.imei,
        reportedFault: request.reportedFault,
        photos: request.photos,
        receivingBranch: request.receivingBranch,
        status: ClaimStatus.RECIBIDO,
        diagnosis: null,
        rejectionReason: null,
        createdAt: now,
        updatedAt: now
      };
      this.mockClaims.set(id, claim);
      return mockResponse(claim);
    }
    return this.http.post<WarrantyClaimResponse>(apiUrl('/api/v1/warranties/claims'), request);
  }

  getWarrantyClaim(claimId: string): Observable<WarrantyClaimResponse> {
    if (environment.useMock) {
      const claim = this.mockClaims.get(claimId);
      return claim ? mockResponse(claim) : mockError(404, 'No se encontró el reclamo solicitado.');
    }
    return this.http.get<WarrantyClaimResponse>(apiUrl(`/api/v1/warranties/claims/${encodeURIComponent(claimId)}`));
  }

  updateWarrantyClaimStatus(claimId: string, request: UpdateWarrantyClaimStatusRequest): Observable<WarrantyClaimResponse> {
    if (environment.useMock) {
      const claim = this.mockClaims.get(claimId);
      if (!claim) return mockError(404, 'No se encontró el reclamo solicitado.');
      if (!Object.values(ClaimStatus).includes(request.status as ClaimStatus)) {
        return mockError(422, 'El estado solicitado no es válido.');
      }
      if (request.status === ClaimStatus.RECHAZADO && !request.rejectionReason?.trim()) {
        return mockError(422, 'Indicá el motivo del rechazo.');
      }
      if (claim.status === ClaimStatus.ENTREGADO || claim.status === ClaimStatus.RECHAZADO) {
        return mockError(409, 'Este reclamo ya está cerrado.');
      }
      const updated: WarrantyClaimResponse = {
        ...claim,
        status: request.status,
        diagnosis: request.diagnosis,
        rejectionReason: request.status === ClaimStatus.RECHAZADO ? request.rejectionReason : null,
        updatedAt: new Date().toISOString()
      };
      this.mockClaims.set(claimId, updated);
      return mockResponse(updated);
    }
    return this.http.patch<WarrantyClaimResponse>(apiUrl(`/api/v1/warranties/claims/${encodeURIComponent(claimId)}/status`), request);
  }
}
