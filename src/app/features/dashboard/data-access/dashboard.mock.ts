import { CriticalStockResponse, PagedResponse, SalesMetricsResponse, TopModelResponse, TransferResponse } from '../models/dashboard.models';

const topModels: TopModelResponse[] = [
  { rank: 1, model: 'Samsung Galaxy A55 128 GB', unitsSold: 42, totalSales: 25200000 },
  { rank: 2, model: 'Motorola Edge 50 256 GB', unitsSold: 31, totalSales: 24800000 },
  { rank: 3, model: 'iPhone 15 128 GB', unitsSold: 18, totalSales: 27000000 }
];

const criticalStock: CriticalStockResponse[] = [
  { branch: 'CENTRO', model: 'Samsung Galaxy A55 128 GB', availableUnits: 1, lastSaleDate: '2026-01-28' },
  { branch: 'NORTE', model: 'Motorola Edge 50 256 GB', availableUnits: 0, lastSaleDate: '2026-01-27' },
  { branch: 'SUR', model: 'iPhone 15 128 GB', availableUnits: 1, lastSaleDate: '2026-01-26' }
];

const transfers: TransferResponse[] = [
  { id: 'TR-1042', model: 'Motorola Edge 50 256 GB', imei: '356938035643809', origin: 'CENTRO', destination: 'NORTE', dispatchedAt: '2026-01-28T10:30:00-03:00', status: 'EN_TRANSITO' },
  { id: 'TR-1043', model: 'Samsung Galaxy A55 128 GB', imei: '490154203237518', origin: 'SUR', destination: 'CENTRO', dispatchedAt: '2026-01-28T12:15:00-03:00', status: 'EN_TRANSITO' }
];

function pageOf<T>(items: T[], page: number, size: number): PagedResponse<T> {
  return {
    content: items.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size)
  };
}

// Datos mock a reemplazar al conectar el backend.
export function mockSalesMetrics(from: string, to: string, branch?: string): SalesMetricsResponse {
  const byBranch = [
    { name: 'CENTRO', saleCount: 60, totalSales: 48000000 },
    { name: 'NORTE', saleCount: 45, totalSales: 36000000 },
    { name: 'SUR', saleCount: 35, totalSales: 28000000 }
  ].filter(item => !branch || item.name === branch);
  const saleCount = byBranch.reduce((sum, item) => sum + item.saleCount, 0);
  const totalSales = byBranch.reduce((sum, item) => sum + item.totalSales, 0);
  return {
    from,
    to,
    saleCount,
    totalSales,
    averageTicket: saleCount ? totalSales / saleCount : 0,
    tradeInPercentage: saleCount ? 18.5 : 0,
    byBranch,
    byChannel: saleCount ? [
      { name: 'Mostrador', saleCount: Math.round(saleCount * 0.7), totalSales: totalSales * 0.7 },
      { name: 'Online', saleCount: saleCount - Math.round(saleCount * 0.7), totalSales: totalSales * 0.3 }
    ] : [],
    byPaymentMethod: saleCount ? [
      { name: 'Tarjeta', saleCount: Math.round(saleCount * 0.6), totalSales: totalSales * 0.6 },
      { name: 'Transferencia', saleCount: saleCount - Math.round(saleCount * 0.6), totalSales: totalSales * 0.4 }
    ] : []
  };
}

export function mockTopModels(page: number, size: number): PagedResponse<TopModelResponse> {
  return pageOf(topModels, page, size);
}

export function mockCriticalStock(branch: string | undefined, page: number, size: number): PagedResponse<CriticalStockResponse> {
  return pageOf(criticalStock.filter(item => !branch || item.branch === branch), page, size);
}

export function mockTransfers(branch: string | undefined, page: number, size: number): PagedResponse<TransferResponse> {
  return pageOf(transfers.filter(item => !branch || item.origin === branch || item.destination === branch), page, size);
}
