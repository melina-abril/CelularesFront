import { ApprovalResponse, CustomerResponse, ImeiResponse } from '../models/counter-sales.models';

// Datos mock a reemplazar al conectar el backend.
export const MOCK_CUSTOMER: CustomerResponse = {
  dni: '30123456', name: 'María Fernández', phone: '1134567890',
  registeredTaxpayer: false, cuit: null
};

export const MOCK_IMEI: ImeiResponse = {
  imei: '359881234567890', model: 'Samsung Galaxy A55 128 GB',
  branch: 'CENTRO', cashPrice: 649999, available: true
};

export function mockApproval(imei: string, percent: number): ApprovalResponse {
  return { id: 'AP-1001', imei, branch: 'CENTRO', percent, approved: false, rejected: false };
}
