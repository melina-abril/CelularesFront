import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { ProblemDetail } from '../../../../shared/models/problem-detail';
import { WarrantiesService } from '../../data-access/warranties.service';
import { WarrantyClaimResponse, WarrantyCoverageResponse } from '../../models/warranties.models';

@Component({
  selector: 'app-warranties-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ErrorAlert, LoadingState],
  templateUrl: './warranties-page.html',
  styleUrl: './warranties-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarrantiesPage {
  private readonly service = inject(WarrantiesService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly searchForm = this.fb.group({ searchBy: 'imei', value: '' });
  readonly claimForm = this.fb.group({ reportedFault: '', photos: '', receivingBranch: 'Sucursal Centro' });
  readonly coverage = signal<LoadState<WarrantyCoverageResponse>>({ status: 'empty' });
  readonly creation = signal<LoadState<WarrantyClaimResponse> | null>(null);

  search(): void {
    const { searchBy, value } = this.searchForm.getRawValue();
    const term = value.trim();
    if (!term) {
      this.coverage.set({ status: 'error', message: 'Ingresá un dato para buscar la venta.' });
      return;
    }
    this.creation.set(null);
    this.coverage.set({ status: 'loading' });
    const query = searchBy === 'dni' ? { dni: term } : searchBy === 'invoiceNumber' ? { invoiceNumber: term } : { imei: term };
    this.service.findWarrantyCoverage(query).subscribe({
      next: data => this.coverage.set({ status: 'ready', data }),
      error: (error: unknown) => this.coverage.set({ status: 'error', message: this.errorMessage(error) })
    });
  }

  createClaim(coverage: WarrantyCoverageResponse): void {
    const { reportedFault, photos, receivingBranch } = this.claimForm.getRawValue();
    if (!reportedFault.trim() || !receivingBranch.trim()) {
      this.creation.set({ status: 'error', message: 'Completá la falla y la sucursal de recepción.' });
      return;
    }
    this.creation.set({ status: 'loading' });
    this.service.createWarrantyClaim({
      imei: coverage.imei,
      reportedFault: reportedFault.trim(),
      photos: photos.split(',').map(photo => photo.trim()).filter(photo => photo.length > 0),
      receivingBranch: receivingBranch.trim()
    }).subscribe({
      next: data => this.creation.set({ status: 'ready', data }),
      error: (error: unknown) => this.creation.set({ status: 'error', message: this.errorMessage(error) })
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (this.isProblemDetail(body)) return body.detail;
    }
    return 'No se pudo completar la operación. Intentá nuevamente.';
  }

  private isProblemDetail(value: unknown): value is ProblemDetail {
    return typeof value === 'object' && value !== null && 'detail' in value && typeof value.detail === 'string';
  }
}
