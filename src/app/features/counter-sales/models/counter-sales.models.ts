export type PaymentMethod = 'CASH' | 'TRANSFER' | 'DEBIT' | 'CREDIT';

// Sucursal se representa como string hasta disponer del enum compartido del backend.
export type Branch = string;

export interface CustomerRequest {
  dni: string;
  name: string;
  phone: string;
  registeredTaxpayer: boolean;
  cuit: string | null;
}

export interface CustomerResponse extends CustomerRequest {}

export interface ImeiRequest {
  imei: string;
}

export interface ImeiResponse {
  imei: string;
  model: string;
  branch: Branch;
  cashPrice: number;
  available: boolean;
}

export interface ApprovalRequest {
  imei: string;
  percent: number;
}

export interface ApprovalResolution {
  approved: boolean;
}

export interface ApprovalResponse {
  id: string;
  imei: string;
  branch: Branch;
  percent: number;
  approved: boolean;
  rejected: boolean;
}

export interface SaleRequest {
  dni: string;
  imei: string;
  accessorySkus: string[];
  discountPercent: number;
  approvalId: string | null;
  voucherCode: string | null;
  paymentMethod: PaymentMethod;
  installments: number | null;
  bank: string | null;
  paymentTotal: number;
}

export interface SaleResponse {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  imei: string;
  dni: string;
  branch: Branch;
  total: number;
  commission: number;
  createdAt: string;
}
