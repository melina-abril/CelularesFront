import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CurrentUser } from '../../../../core/session/current-user';
import { UserRole } from '../../../../core/session/user-role';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { ProblemDetail } from '../../../../shared/models/problem-detail';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';
import { OrdersService } from '../../data-access/orders.service';
import { ORDER_STATUSES, OrderFilters, OrderPageResponse, OrderStatus, PaymentMethod, orderStatusLabel } from '../../models/orders.models';

@Component({
  selector: 'app-orders-page', standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ErrorAlert, LoadingState, ArsPipe],
  templateUrl: './orders-page.html', styleUrl: './orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPage {
  private readonly service = inject(OrdersService);
  private readonly user = inject(CurrentUser);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private request?: Subscription;
  readonly statuses = ORDER_STATUSES;
  readonly state = signal<LoadState<OrderPageResponse>>({ status: 'loading' });
  readonly page = signal(0);
  readonly filters = this.fb.group({ status: this.fb.control<OrderStatus | ''>(''), branch: this.fb.control(''), paymentMethod: this.fb.control<PaymentMethod | ''>(''), from: this.fb.control(''), to: this.fb.control('') });
  readonly fixedBranch = this.user.user().role === UserRole.VENDEDOR || this.user.user().role === UserRole.SUPERVISOR;
  readonly branchOptions = ['CENTRO', 'NORTE', 'SUR'];
  readonly paymentOptions: readonly PaymentMethod[] = ['TRANSFERENCIA', 'TARJETA'];
  readonly now = signal(Date.now());

  constructor() {
    if (this.fixedBranch) this.filters.controls.branch.setValue('CENTRO');
    const timer = setInterval(() => this.now.set(Date.now()), 60_000);
    this.destroyRef.onDestroy(() => { clearInterval(timer); this.request?.unsubscribe(); });
    this.load();
  }

  statusLabel(status: OrderStatus): string { return orderStatusLabel(status); }

  applyFilters(): void { this.page.set(0); this.load(); }
  changePage(page: number): void { this.page.set(page); this.load(); }

  remaining(deadline: string): string {
    const minutes = Math.max(0, Math.ceil((Date.parse(deadline) - this.now()) / 60_000));
    return minutes === 0 ? 'Plazo vencido' : `${Math.floor(minutes / 60)} h ${minutes % 60} min restantes`;
  }

  load(): void {
    this.request?.unsubscribe();
    this.state.set({ status: 'loading' });
    const values = this.filters.getRawValue();
    const filters: OrderFilters = {
      ...values, branch: this.fixedBranch ? 'CENTRO' : values.branch,
      from: values.from ? new Date(`${values.from}T00:00:00`).toISOString() : '',
      to: values.to ? new Date(`${values.to}T23:59:59`).toISOString() : '',
      page: this.page(), size: 10
    };
    this.request = this.service.listOrders(filters).subscribe({
      next: data => this.state.set(data.items.length ? { status: 'ready', data } : { status: 'empty' }),
      error: (error: unknown) => {
        const detail = error instanceof HttpErrorResponse ? (error.error as ProblemDetail | null)?.detail : null;
        this.state.set({ status: 'error', message: detail ?? 'No se pudieron cargar los pedidos.' });
      }
    });
  }
}
