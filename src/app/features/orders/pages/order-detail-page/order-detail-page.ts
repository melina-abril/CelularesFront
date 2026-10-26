import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CurrentUser } from '../../../../core/session/current-user';
import { UserRole } from '../../../../core/session/user-role';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { ProblemDetail } from '../../../../shared/models/problem-detail';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';
import { OrdersService } from '../../data-access/orders.service';
import { OrderResponse, OrderStatus, orderStatusLabel } from '../../models/orders.models';

@Component({
  selector: 'app-order-detail-page', standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ErrorAlert, LoadingState, ArsPipe],
  templateUrl: './order-detail-page.html', styleUrl: './order-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailPage {
  private readonly service = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);
  private readonly user = inject(CurrentUser);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private request?: Subscription;
  private updateRequest?: Subscription;
  readonly state = signal<LoadState<OrderResponse>>({ status: 'loading' });
  readonly updateState = signal<LoadState<OrderResponse> | null>(null);
  readonly canUpdate = this.user.user().role !== UserRole.GERENCIA;
  readonly form = this.fb.group({ status: this.fb.control<OrderStatus | ''>('', { validators: [Validators.required] }), imei: this.fb.control('') });
  readonly now = signal(Date.now());

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 60_000);
    this.destroyRef.onDestroy(() => { clearInterval(timer); this.request?.unsubscribe(); this.updateRequest?.unsubscribe(); });
    this.load();
  }

  statusLabel(status: OrderStatus): string { return orderStatusLabel(status); }

  remaining(deadline: string): string {
    const minutes = Math.max(0, Math.ceil((Date.parse(deadline) - this.now()) / 60_000));
    return minutes === 0 ? 'Plazo vencido' : `${Math.floor(minutes / 60)} h ${minutes % 60} min restantes`;
  }

  load(): void {
    this.request?.unsubscribe();
    this.state.set({ status: 'loading' });
    const id = this.route.snapshot.paramMap.get('orderId');
    if (!id) { this.state.set({ status: 'empty' }); return; }
    this.request = this.service.getOrder(id).subscribe({
      next: order => this.state.set({ status: 'ready', data: order }),
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) { this.state.set({ status: 'empty' }); return; }
        const detail = error instanceof HttpErrorResponse ? (error.error as ProblemDetail | null)?.detail : null;
        this.state.set({ status: 'error', message: detail ?? 'No se pudo consultar el pedido.' });
      }
    });
  }

  advance(): void {
    const current = this.state();
    const status = this.form.controls.status.value;
    if (!this.canUpdate || current.status !== 'ready' || !status || !current.data.nextStatuses.includes(status)) return;
    if (status === 'PREPARADO' && !/^\d{15}$/.test(this.form.controls.imei.value.trim())) {
      this.form.controls.imei.setErrors({ imei: true });
      return;
    }
    this.updateRequest?.unsubscribe();
    this.updateState.set({ status: 'loading' });
    this.updateRequest = this.service.advanceOrderStatus(current.data.id, { status, imei: status === 'PREPARADO' ? this.form.controls.imei.value.trim() : null }).subscribe({
      next: order => {
        this.state.set({ status: 'ready', data: order });
        this.updateState.set({ status: 'ready', data: order });
        this.form.reset({ status: '', imei: '' });
      },
      error: (error: unknown) => {
        const detail = error instanceof HttpErrorResponse ? (error.error as ProblemDetail | null)?.detail : null;
        this.updateState.set({ status: 'error', message: detail ?? 'No se pudo actualizar el pedido.' });
      }
    });
  }
}
