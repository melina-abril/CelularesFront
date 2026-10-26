export interface DeviceRequest { brand: string; model: string; memoryGb: number; }
export interface ChecklistRequest { powersOn: boolean; screenIntact: boolean; batteryPercent: number; accountUnlocked: boolean; boxAndCharger: boolean; }
export interface QuoteRequest { branch: string; device: DeviceRequest; checklist: ChecklistRequest; }
export interface UpdateQuoteRequest { device: DeviceRequest; checklist: ChecklistRequest; }
export interface ApprovalRequest { imei: string; proposedValue: number; reason: string; }
export interface ResolutionRequest { approved: boolean; }
export interface ConfirmationRequest { imei: string; proposedValue: number; }
export type VoucherStatus = 'AVAILABLE' | 'CONFIRMED';
export interface VoucherResponse {
  code: string; branch: string; declaredDevice: DeviceRequest; declaredChecklist: ChecklistRequest;
  verifiedDevice: DeviceRequest | null; verifiedChecklist: ChecklistRequest | null;
  estimate: number; issuedAt: string; expiresAt: string; status: VoucherStatus;
  confirmedImei: string | null; finalValue: number | null;
}
export type ReportStatus = 'CLEAR' | 'REPORTED' | 'INVALID' | 'UNDETERMINED';
export interface ImeiReportResponse { imei: string; status: ReportStatus; }
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface ApprovalResponse {
  id: string; code: string; seller: string; branch: string; imei: string;
  estimate: number; proposed: number; deviationPercent: number; reason: string;
  batteryPercent: number | null; status: ApprovalStatus;
}
