import { ClaimStatus, WarrantyClaimResponse, WarrantyCoverageResponse } from '../models/warranties.models';

// Datos mock a reemplazar al conectar el backend.
export const MOCK_COVERAGE: WarrantyCoverageResponse = {
  imei: '356789012345678',
  model: 'Samsung Galaxy S24 256 GB',
  condition: 'NUEVO',
  invoiceNumber: 'B-0004-00001238',
  deliveredAt: '2026-03-15T15:30:00-03:00',
  expiresAt: '2027-03-15T15:30:00-03:00',
  covered: true
};

export const MOCK_CLAIM: WarrantyClaimResponse = {
  id: 'GAR-1042',
  imei: MOCK_COVERAGE.imei,
  reportedFault: 'La pantalla deja de responder al tacto.',
  photos: ['foto-frente.jpg'],
  receivingBranch: 'Sucursal Centro',
  status: ClaimStatus.EN_DIAGNOSTICO,
  diagnosis: 'Se está evaluando el módulo de pantalla.',
  rejectionReason: null,
  createdAt: '2026-05-18T10:15:00-03:00',
  updatedAt: '2026-05-19T09:00:00-03:00'
};
