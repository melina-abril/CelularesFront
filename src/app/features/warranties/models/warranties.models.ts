export interface WarrantyCoverageResponse {
  imei: string;
  model: string;
  condition: string;
  invoiceNumber: string;
  deliveredAt: string;
  expiresAt: string;
  covered: boolean;
}

export interface CreateWarrantyClaimRequest {
  imei: string;
  reportedFault: string;
  photos: string[];
  receivingBranch: string;
}

export interface WarrantyClaimResponse {
  id: string;
  imei: string;
  reportedFault: string;
  photos: string[];
  receivingBranch: string;
  status: string;
  diagnosis: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateWarrantyClaimStatusRequest {
  status: string;
  diagnosis: string | null;
  rejectionReason: string | null;
}

export enum ClaimStatus {
  RECIBIDO = 'RECIBIDO',
  EN_DIAGNOSTICO = 'EN_DIAGNOSTICO',
  EN_REPARACION = 'EN_REPARACION',
  REEMPLAZO_APROBADO = 'REEMPLAZO_APROBADO',
  LISTO_PARA_RETIRAR = 'LISTO_PARA_RETIRAR',
  ENTREGADO = 'ENTREGADO',
  RECHAZADO = 'RECHAZADO'
}
