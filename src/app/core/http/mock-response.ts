import { HttpErrorResponse } from '@angular/common/http';
import { Observable, delay, of, switchMap, throwError, timer } from 'rxjs';
import { ProblemDetail } from '../../shared/models/problem-detail';

export function mockResponse<T>(data: T): Observable<T> {
  // Respuesta mock a reemplazar al conectar el backend.
  return of(data).pipe(delay(180));
}

export function mockError(status: number, detail: string): Observable<never> {
  // Error mock a reemplazar al conectar el backend.
  const problem: ProblemDetail = {
    title: 'No se pudo completar la operación',
    status,
    detail,
    code: `HTTP_${status}`,
    errors: {}
  };
  return timer(180).pipe(
    switchMap(() => throwError(() => new HttpErrorResponse({
      status,
      statusText: problem.title,
      error: problem
    })))
  );
}
