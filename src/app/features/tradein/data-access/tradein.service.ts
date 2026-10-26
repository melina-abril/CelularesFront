import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { environment } from '../../../../environments/environment';
import { CurrentUser } from '../../../core/session/current-user';
import { sampleApproval, sampleVoucher } from './tradein.mock';
import { ApprovalRequest, ApprovalResponse, ConfirmationRequest, ImeiReportResponse, QuoteRequest, ResolutionRequest, UpdateQuoteRequest, VoucherResponse } from '../models/tradein.models';

@Injectable({ providedIn: 'root' })
export class TradeinService {
  private readonly http = inject(HttpClient);
  private readonly currentUser = inject(CurrentUser);
  private readonly vouchers = new Map<string, VoucherResponse>([[sampleVoucher.code, { ...sampleVoucher }]]);
  private readonly approvals = new Map<string, ApprovalResponse>();

  createQuote(request: QuoteRequest): Observable<VoucherResponse> {
    if (environment.useMock) {
      if (!request.device.brand.trim() || !request.device.model.trim() || request.device.memoryGb <= 0) return mockError(422, 'Seleccioná un equipo válido');
      if (!request.checklist.screenIntact) return mockError(422, 'Canje rechazado: pantalla rota');
      if (!request.checklist.accountUnlocked) return mockError(422, 'Canje rechazado: bloqueo de cuenta');
      const issuedAt = new Date();
      const voucher: VoucherResponse = {
        code: `CANJE-${issuedAt.getTime()}`, branch: request.branch,
        declaredDevice: { ...request.device }, declaredChecklist: { ...request.checklist },
        verifiedDevice: null, verifiedChecklist: null, estimate: this.estimate(request.device.memoryGb, request.checklist.batteryPercent),
        issuedAt: issuedAt.toISOString(), expiresAt: new Date(issuedAt.getTime() + 72 * 60 * 60 * 1000).toISOString(),
        status: 'AVAILABLE', confirmedImei: null, finalValue: null
      };
      this.vouchers.set(voucher.code, voucher);
      return mockResponse({ ...voucher });
    }
    return this.http.post<VoucherResponse>(apiUrl('/api/v1/tradein/quotes'), request);
  }

  getVoucher(code: string): Observable<VoucherResponse> {
    if (environment.useMock) {
      const voucher = this.vouchers.get(code);
      return voucher ? mockResponse({ ...voucher }) : mockError(404, 'El vale no existe');
    }
    return this.http.get<VoucherResponse>(apiUrl(`/api/v1/tradein/vouchers/${encodeURIComponent(code)}`));
  }

  updateVerifiedQuote(code: string, request: UpdateQuoteRequest): Observable<VoucherResponse> {
    if (environment.useMock) {
      const voucher = this.available(code);
      if (!voucher) return mockError(422, 'El vale no está disponible o está vencido');
      if (!request.device.brand.trim() || !request.device.model.trim() || request.device.memoryGb <= 0) return mockError(422, 'Seleccioná un equipo válido');
      if (!request.checklist.screenIntact) return mockError(422, 'Canje rechazado: pantalla rota');
      if (!request.checklist.accountUnlocked) return mockError(422, 'Canje rechazado: bloqueo de cuenta');
      const updated: VoucherResponse = { ...voucher, verifiedDevice: { ...request.device }, verifiedChecklist: { ...request.checklist }, estimate: this.estimate(request.device.memoryGb, request.checklist.batteryPercent) };
      this.vouchers.set(code, updated);
      this.approvals.delete(code);
      return mockResponse({ ...updated });
    }
    return this.http.patch<VoucherResponse>(apiUrl(`/api/v1/tradein/vouchers/${encodeURIComponent(code)}/quote`), request);
  }

  checkImeiReport(imei: string): Observable<ImeiReportResponse> {
    if (environment.useMock) {
      if (!/^\d{15}$/.test(imei)) return mockResponse({ imei, status: 'INVALID' });
      return mockResponse({ imei, status: imei === '351234567890999' ? 'REPORTED' : 'CLEAR' });
    }
    return this.http.get<ImeiReportResponse>(apiUrl(`/api/v1/tradein/imei/${encodeURIComponent(imei)}/report`));
  }

  requestValueApproval(code: string, request: ApprovalRequest): Observable<ApprovalResponse> {
    if (environment.useMock) {
      const voucher = this.available(code);
      if (!voucher || !/^\d{15}$/.test(request.imei) || request.proposedValue <= 0 || !request.reason.trim()) return mockError(422, 'La solicitud de aprobación tiene datos inválidos');
      const approval: ApprovalResponse = {
        ...sampleApproval, id: `APR-${Date.now()}`, code, seller: this.currentUser.user().name,
        branch: voucher.branch, imei: request.imei, estimate: voucher.estimate, proposed: request.proposedValue,
        deviationPercent: (request.proposedValue - voucher.estimate) / voucher.estimate * 100,
        reason: request.reason, batteryPercent: (voucher.verifiedChecklist ?? voucher.declaredChecklist).batteryPercent, status: 'PENDING'
      };
      this.approvals.set(code, approval);
      return mockResponse({ ...approval });
    }
    return this.http.post<ApprovalResponse>(apiUrl(`/api/v1/tradein/vouchers/${encodeURIComponent(code)}/approvals`), request);
  }

  getValueApproval(code: string): Observable<ApprovalResponse> {
    if (environment.useMock) {
      const approval = this.approvals.get(code);
      return approval ? mockResponse({ ...approval }) : mockError(404, 'No hay una solicitud de aprobación para este vale');
    }
    return this.http.get<ApprovalResponse>(apiUrl(`/api/v1/tradein/vouchers/${encodeURIComponent(code)}/approvals`));
  }

  resolveValueApproval(approvalId: string, request: ResolutionRequest): Observable<ApprovalResponse> {
    if (environment.useMock) {
      const approval = [...this.approvals.values()].find(item => item.id === approvalId);
      if (!approval || approval.status !== 'PENDING') return mockError(409, 'La solicitud ya no está pendiente');
      const resolved: ApprovalResponse = { ...approval, status: request.approved ? 'APPROVED' : 'REJECTED' };
      this.approvals.set(approval.code, resolved);
      return mockResponse({ ...resolved });
    }
    return this.http.patch<ApprovalResponse>(apiUrl(`/api/v1/tradein/approvals/${encodeURIComponent(approvalId)}`), request);
  }

  confirmFinalValue(code: string, request: ConfirmationRequest): Observable<VoucherResponse> {
    if (environment.useMock) {
      const voucher = this.available(code);
      if (!voucher) return mockError(422, 'El vale no está disponible o está vencido');
      const checklist = voucher.verifiedChecklist ?? voucher.declaredChecklist;
      if (!checklist.screenIntact) return mockError(422, 'Canje rechazado: pantalla rota');
      if (!checklist.accountUnlocked) return mockError(422, 'Canje rechazado: bloqueo de cuenta');
      if (request.imei === '351234567890999') return mockError(422, 'Canje rechazado: equipo denunciado');
      if (!/^\d{15}$/.test(request.imei) || request.proposedValue <= 0) return mockError(422, 'Datos de confirmación inválidos');
      const deviation = Math.abs((request.proposedValue - voucher.estimate) / voucher.estimate * 100);
      const approval = this.approvals.get(code);
      if (deviation > 10 && (approval?.status !== 'APPROVED' || approval.imei !== request.imei || approval.proposed !== request.proposedValue || approval.estimate !== voucher.estimate)) return mockError(409, 'Se requiere aprobación del supervisor');
      const confirmed: VoucherResponse = { ...voucher, status: 'CONFIRMED', confirmedImei: request.imei, finalValue: request.proposedValue };
      this.vouchers.set(code, confirmed);
      return mockResponse({ ...confirmed });
    }
    return this.http.post<VoucherResponse>(apiUrl(`/api/v1/tradein/vouchers/${encodeURIComponent(code)}/confirmation`), request);
  }

  private available(code: string): VoucherResponse | null {
    const voucher = this.vouchers.get(code);
    return voucher && voucher.status === 'AVAILABLE' && Date.parse(voucher.expiresAt) > Date.now() ? voucher : null;
  }

  private estimate(memoryGb: number, batteryPercent: number): number {
    return Math.max(10000, Math.round((150000 + memoryGb * 300 - (batteryPercent < 80 ? 25000 : 0)) / 1000) * 1000);
  }
}
