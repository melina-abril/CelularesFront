export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD';
export type PaymentOptionStatus = 'AVAILABLE' | 'INTEREST_FREE_TODAY' | 'UNAVAILABLE_TODAY';
export type PromotionDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface PaymentOptionResponse {
  method: PaymentMethod;
  bank: string | null;
  installments: number;
  installmentAmount: number;
  total: number;
  adjustmentPercent: number;
  cftAnnualPercent: number;
  status: PaymentOptionStatus;
  statusLabel: string;
  unavailableReason: string | null;
  promotionDays: PromotionDay[];
  validFrom: string | null;
  validTo: string | null;
}

export interface PaymentOptionsResponse {
  variantId: string;
  model: string;
  memoryGb: number;
  color: string;
  condition: string;
  listPrice: number;
  currency: string;
  queryDate: string;
  interestFreePromotions: number;
  options: PaymentOptionResponse[];
}
