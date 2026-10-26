import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CounterSalesService } from '../../data-access/counter-sales.service';
import { ApprovalResponse } from '../../models/counter-sales.models';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';

@Component({
  selector: 'app-discount-approval-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorAlert, LoadingState],
  templateUrl: './discount-approval-page.html',
  styleUrl: './discount-approval-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountApprovalPage {
  private readonly service = inject(CounterSalesService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = this.fb.group({ approvalId: ['', Validators.required] });
  readonly result = signal<LoadState<ApprovalResponse>>({ status: 'empty' });

  resolve(approved: boolean): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.result.set({ status: 'loading' });
    this.service.resolveDiscountApproval(this.form.getRawValue().approvalId.trim(), { approved }).subscribe({
      next: data => this.result.set({ status: 'ready', data }),
      error: (error: unknown) => {
        let message = 'No se pudo resolver la solicitud.';
        if (error instanceof HttpErrorResponse) {
          const body: unknown = error.error;
          if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') message = body.detail;
        }
        this.result.set({ status: 'error', message });
      }
    });
  }
}
