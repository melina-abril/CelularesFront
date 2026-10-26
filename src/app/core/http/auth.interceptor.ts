import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { CurrentUser } from '../session/current-user';
import { ProblemDetail } from '../../shared/models/problem-detail';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toProblemDetail(body: unknown, status: number): ProblemDetail | null {
  if (!isRecord(body) || typeof body['detail'] !== 'string') {
    return null;
  }

  const fieldErrors: Record<string, string[]> = {};
  if (isRecord(body['errors'])) {
    for (const [field, messages] of Object.entries(body['errors'])) {
      if (Array.isArray(messages) && messages.every((message: unknown) => typeof message === 'string')) {
        fieldErrors[field] = messages as string[];
      }
    }
  }

  return {
    title: typeof body['title'] === 'string' ? body['title'] : 'Error',
    status: typeof body['status'] === 'number' ? body['status'] : status,
    detail: body['detail'],
    code: typeof body['code'] === 'string' ? body['code'] : 'HTTP_ERROR',
    errors: fieldErrors
  };
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(CurrentUser).user().token;
  const authorizedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const problem = toProblemDetail(error.error, error.status);
      if (!problem) {
        return throwError(() => error);
      }

      return throwError(() => new HttpErrorResponse({
        error: problem,
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url ?? undefined
      }));
    })
  );
};
