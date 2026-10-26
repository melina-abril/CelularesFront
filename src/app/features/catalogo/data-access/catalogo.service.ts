import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { CurrentUser } from '../../../core/session/current-user';
import { UserRole } from '../../../core/session/user-role';
import { environment } from '../../../../environments/environment';
import { AvisoResponse, CatalogoFiltro, CatalogoPageResponse, CrearAvisoRequest, ModeloDetalleResponse } from '../models/catalogo.models';
import { mockCreateStockAlert, mockListModels, mockModelDetail } from './catalogo.mock';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly currentUser = inject(CurrentUser);

  private showQuantities(): boolean {
    const role = this.currentUser.user().role;
    return role === UserRole.VENDEDOR || role === UserRole.SUPERVISOR;
  }

  listModels(filter: CatalogoFiltro): Observable<CatalogoPageResponse> {
    if (environment.useMock) {
      // Respuesta mock a reemplazar al conectar el backend.
      return mockResponse(mockListModels(filter, this.showQuantities()));
    }
    let params = new HttpParams().set('page', filter.page).set('size', filter.size);
    if (filter.marca) params = params.set('marca', filter.marca);
    if (filter.precioMinimo !== null) params = params.set('precioMinimo', filter.precioMinimo);
    if (filter.precioMaximo !== null) params = params.set('precioMaximo', filter.precioMaximo);
    if (filter.memoriaGb !== null) params = params.set('memoriaGb', filter.memoriaGb);
    if (filter.condicion) params = params.set('condicion', filter.condicion);
    if (filter.sucursal) params = params.set('sucursal', filter.sucursal);
    return this.http.get<CatalogoPageResponse>(apiUrl('/api/v1/catalogo/modelos'), { params });
  }

  getModelDetail(modeloId: string): Observable<ModeloDetalleResponse> {
    if (environment.useMock) {
      // Respuesta mock a reemplazar al conectar el backend.
      const detail = mockModelDetail(modeloId, this.showQuantities());
      return detail ? mockResponse(detail) : mockError(404, 'No se encontró el modelo solicitado');
    }
    return this.http.get<ModeloDetalleResponse>(apiUrl(`/api/v1/catalogo/modelos/${encodeURIComponent(modeloId)}`));
  }

  createStockAlert(request: CrearAvisoRequest): Observable<AvisoResponse> {
    if (environment.useMock) {
      // Respuesta mock a reemplazar al conectar el backend.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.correo)) return mockError(422, 'Ingresá un correo electrónico válido');
      const response = mockCreateStockAlert(request);
      return response ? mockResponse(response) : mockError(409, 'Esta variante ya tiene stock disponible');
    }
    return this.http.post<AvisoResponse>(apiUrl('/api/v1/catalogo/avisos'), request);
  }
}
