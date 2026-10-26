import { ApprovalResponse, ChecklistRequest, DeviceRequest, VoucherResponse } from '../models/tradein.models';

const issuedAt = new Date().toISOString();
const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
export const sampleDevice: DeviceRequest = { brand: 'Samsung', model: 'Galaxy S22', memoryGb: 128 };
export const sampleChecklist: ChecklistRequest = { powersOn: true, screenIntact: true, batteryPercent: 85, accountUnlocked: true, boxAndCharger: true };

// Datos mock con la misma forma de los DTO del backend; se reemplazan al conectarlo.
export const sampleVoucher: VoucherResponse = {
  code: 'CANJE-2026-001', branch: 'CENTRO', declaredDevice: { ...sampleDevice },
  declaredChecklist: { ...sampleChecklist }, verifiedDevice: null, verifiedChecklist: null,
  estimate: 180000, issuedAt, expiresAt, status: 'AVAILABLE', confirmedImei: null, finalValue: null
};
export const sampleApproval: ApprovalResponse = {
  id: 'APR-001', code: sampleVoucher.code, seller: 'Vendedor de prueba', branch: 'CENTRO',
  imei: '351234567890123', estimate: 180000, proposed: 205000, deviationPercent: 13.9,
  reason: 'Excelente estado comprobado', batteryPercent: 85, status: 'PENDING'
};
