import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentsService } from '../../data-access/payments.service';
import { PaymentMethod, PaymentOptionsResponse, PromotionDay } from '../../models/payments.models';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';

function localDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ArsPipe, ErrorAlert, LoadingState],
  templateUrl: './payments-page.html',
  styleUrl: './payments-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(PaymentsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private request?: Subscription;

  readonly state = signal<LoadState<PaymentOptionsResponse>>({ status: 'loading' });
  readonly form = this.formBuilder.nonNullable.group({
    variantId: '',
    date: localDate()
  });

  private readonly days: Record<PromotionDay, string> = {
    MONDAY: 'lunes', TUESDAY: 'martes', WEDNESDAY: 'miércoles',
    THURSDAY: 'jueves', FRIDAY: 'viernes', SATURDAY: 'sábado', SUNDAY: 'domingo'
  };

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const variantId = params.get('variantId')?.trim() ?? '';
      this.form.controls.variantId.setValue(variantId);
      this.load(variantId);
    });
  }

  consult(): void {
    const variantId = this.form.controls.variantId.value.trim();
    if (!variantId) {
      this.load('');
      return;
    }
    if (variantId !== this.route.snapshot.paramMap.get('variantId')) {
      void this.router.navigate(['/payments', variantId]);
    } else {
      this.load(variantId);
    }
  }

  methodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      CASH: 'Contado', BANK_TRANSFER: 'Transferencia',
      DEBIT_CARD: 'Débito', CREDIT_CARD: 'Tarjeta de crédito'
    };
    return labels[method];
  }

  promotionLabel(days: PromotionDay[]): string {
    return days.map(day => this.days[day]).join(', ');
  }

  private load(variantId: string): void {
    this.request?.unsubscribe();
    if (!variantId) {
      this.state.set({ status: 'error', message: 'No se pudo identificar la variante elegida' });
      return;
    }

    const date = this.form.controls.date.value;
    this.state.set({ status: 'loading' });
    this.request = this.service.getPaymentOptions(variantId, date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => this.state.set(response.options.length
          ? { status: 'ready', data: response }
          : { status: 'empty' }),
        error: (error: unknown) => {
          const missing = error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
          this.state.set({
            status: 'error',
            message: missing
              ? 'No se pudo identificar la variante elegida'
              : 'No se pudieron consultar las opciones de pago. Intentá nuevamente'
          });
        }
      });
  }
}
