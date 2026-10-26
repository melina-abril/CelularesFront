import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { ProblemDetail } from '../../../../shared/models/problem-detail';
import { WarrantiesService } from '../../data-access/warranties.service';
import { ClaimStatus, WarrantyClaimResponse } from '../../models/warranties.models';

@Component({
  selector: 'app-warranty-claim-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ErrorAlert, LoadingState],
  templateUrl: './warranty-claim-page.html',
  styleUrl: './warranty-claim-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarrantyClaimPage {
  private readonly service = inject(WarrantiesService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly claim = signal<LoadState<WarrantyClaimResponse>>({ status: 'loading' });
  readonly update = signal<LoadState<WarrantyClaimResponse> | null>(null);
  readonly statusOptions = Object.values(ClaimStatus);
  readonly statusForm = this.fb.group({ status: ClaimStatus.EN_DIAGNOSTICO as string, diagnosis: '', rejectionReason: '' });

  constructor() {
    const id = this.route.snapshot.paramMap.get('claimId');
    if (!id) {
      this.claim.set({ status: 'error', message: 'Falta el número de reclamo.' });
      return;
    }
    this.service.getWarrantyClaim(id).subscribe({
      next: data => {
        this.claim.set({ status: 'ready', data });
        this.statusForm.patchValue({ status: data.status, diagnosis: data.diagnosis ?? '', rejectionReason: data.rejectionReason ?? '' });
      },
      error: (error: unknown) => this.claim.set({ status: 'error', message: this.errorMessage(error) })
    });
  }

  save(claimId: string): void {
    const { status, diagnosis, rejectionReason } = this.statusForm.getRawValue();
    if (status === ClaimStatus.RECHAZADO && !rejectionReason.trim()) {
      this.update.set({ status: 'error', message: 'Indicá el motivo del rechazo.' });
      return;
    }
    this.update.set({ status: 'loading' });
    this.service.updateWarrantyClaimStatus(claimId, {
      status,
      diagnosis: diagnosis.trim() || null,
      rejectionReason: status === ClaimStatus.RECHAZADO ? rejectionReason.trim() : null
    }).subscribe({
      next: data => {
        this.claim.set({ status: 'ready', data });
        this.update.set({ status: 'ready', data });
      },
      error: (error: unknown) => this.update.set({ status: 'error', message: this.errorMessage(error) })
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
