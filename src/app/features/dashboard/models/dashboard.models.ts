export type Sucursal = string;

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Breakdown {
  name: string;
  saleCount: number;
  totalSales: number;
}

export interface SalesMetricsResponse {
  from: string;
  to: string;
  saleCount: number;
  totalSales: number;
  averageTicket: number;
  tradeInPercentage: number;
  byBranch: Breakdown[];
  byChannel: Breakdown[];
  byPaymentMethod: Breakdown[];
}

export interface TopModelResponse {
  rank: number;
  model: string;
  unitsSold: number;
  totalSales: number;
}

export interface CriticalStockResponse {
  branch: Sucursal;
  model: string;
  availableUnits: number;
  lastSaleDate: string;
}

export interface TransferResponse {
  id: string;
  model: string;
  imei: string;
  origin: Sucursal;
  destination: Sucursal;
  dispatchedAt: string;
  status: string;
}
