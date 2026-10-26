import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../core/http/api-url';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { environment } from '../../../../environments/environment';
import { PaymentOptionsResponse } from '../models/payments.models';
import { mockPaymentOptions } from './payments.mock';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);

  getPaymentOptions(variantId: string, date: string): Observable<PaymentOptionsResponse> {
    if (environment.useMock) {
      if (variantId === 'consulta-fallida') {
        return mockError(503, 'No se pudieron obtener las condiciones de financiación.');
      }
      if (variantId === 'variante-inexistente') {
        return mockError(404, 'La variante elegida no existe.');
      }
      return mockResponse(mockPaymentOptions(variantId, date));
    }

    return this.http.get<PaymentOptionsResponse>(
      apiUrl(`/api/v1/payments/variants/${encodeURIComponent(variantId)}/options`),
      { params: { date } }
    );
  }
}
