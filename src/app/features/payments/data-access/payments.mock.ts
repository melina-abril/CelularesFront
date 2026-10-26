import { PaymentOptionResponse, PaymentOptionsResponse, PromotionDay } from '../models/payments.models';

const promotionDays: PromotionDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY'];

export function mockPaymentOptions(variantId: string, date: string): PaymentOptionsResponse {
  // Datos mock a reemplazar al conectar el backend.
  const day = new Date(`${date}T12:00:00`).getDay();
  const promotionApplies = day >= 1 && day <= 3;
  const year = date.slice(0, 4);
  const validFrom = `${year}-01-01`;
  const validTo = `${year}-12-31`;

  const options: PaymentOptionResponse[] = [
    {
      method: 'CASH', bank: null, installments: 1, installmentAmount: 1140000,
      total: 1140000, adjustmentPercent: -5, cftAnnualPercent: 0,
      status: 'AVAILABLE', statusLabel: 'Disponible', unavailableReason: null,
      promotionDays: [], validFrom, validTo
    },
    {
      method: 'BANK_TRANSFER', bank: null, installments: 1, installmentAmount: 1140000,
      total: 1140000, adjustmentPercent: -5, cftAnnualPercent: 0,
      status: 'AVAILABLE', statusLabel: 'Disponible', unavailableReason: null,
      promotionDays: [], validFrom, validTo
    },
    {
      method: 'DEBIT_CARD', bank: null, installments: 1, installmentAmount: 1200000,
      total: 1200000, adjustmentPercent: 0, cftAnnualPercent: 0,
      status: 'AVAILABLE', statusLabel: 'Disponible', unavailableReason: null,
      promotionDays: [], validFrom, validTo
    },
    {
      method: 'CREDIT_CARD', bank: 'Banco Nación', installments: 1, installmentAmount: 1200000,
      total: 1200000, adjustmentPercent: 0, cftAnnualPercent: 0,
      status: 'AVAILABLE', statusLabel: 'Disponible', unavailableReason: null,
      promotionDays: [], validFrom, validTo
    }
  ];

  for (const [installments, installmentAmount, adjustmentPercent, cftAnnualPercent] of [
    [3, 400000, 0, 0],
    [6, 220000, 10, 24],
    [9, 160000, 20, 36],
    [12, 130000, 30, 48],
    [18, 100000, 50, 62]
  ]) {
    const promotional = installments === 3;
    const enabled = !promotional || promotionApplies;
    options.push({
      method: 'CREDIT_CARD', bank: 'Banco Nación', installments,
      installmentAmount, total: installments * installmentAmount,
      adjustmentPercent, cftAnnualPercent,
      status: promotional ? (enabled ? 'INTEREST_FREE_TODAY' : 'UNAVAILABLE_TODAY') : 'AVAILABLE',
      statusLabel: promotional ? (enabled ? 'Sin interés hoy' : 'No disponible hoy') : 'Disponible',
      unavailableReason: enabled ? null : 'Solo lunes a miércoles',
      promotionDays: promotional ? promotionDays : [], validFrom, validTo
    });
  }

  return {
    variantId,
    model: 'iPhone 15',
    memoryGb: 128,
    color: 'Negro',
    condition: 'Nuevo',
    listPrice: 1200000,
    currency: 'ARS',
    queryDate: date,
    interestFreePromotions: promotionApplies ? 1 : 0,
    options: variantId === 'sin-opciones' ? [] : options
  };
}
