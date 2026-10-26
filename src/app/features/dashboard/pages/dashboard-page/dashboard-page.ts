import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CurrentUser } from '../../../../core/session/current-user';
import { UserRole } from '../../../../core/session/user-role';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { ProblemDetail } from '../../../../shared/models/problem-detail';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';
import { DashboardQuery, DashboardService } from '../../data-access/dashboard.service';
import { CriticalStockResponse, PagedResponse, SalesMetricsResponse, TopModelResponse, TransferResponse } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, ArsPipe, ErrorAlert, LoadingState],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage {
  private readonly service = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly builder = inject(FormBuilder);
  readonly currentUser = inject(CurrentUser);
  readonly isSupervisor = computed(() => this.currentUser.user().role === UserRole.SUPERVISOR);
  readonly authorized = computed(() => [UserRole.SUPERVISOR, UserRole.GERENCIA].includes(this.currentUser.user().role));
  readonly filters = this.builder.nonNullable.group({ from: '2026-01-01', to: '2026-01-31', branch: '' });
  readonly branches = ['CENTRO', 'NORTE', 'SUR'];
  readonly sales = signal<LoadState<SalesMetricsResponse>>({ status: 'loading' });
  readonly models = signal<LoadState<PagedResponse<TopModelResponse>>>({ status: 'loading' });
  readonly stock = signal<LoadState<PagedResponse<CriticalStockResponse>>>({ status: 'loading' });
  readonly transfers = signal<LoadState<PagedResponse<TransferResponse>>>({ status: 'loading' });
  readonly modelPage = signal(0);
  readonly stockPage = signal(0);
  readonly transferPage = signal(0);

  constructor() {
    effect(() => {
      const user = this.currentUser.user();
      if (user.role === UserRole.SUPERVISOR || user.role === UserRole.GERENCIA) {
        this.applyFilters();
      }
    });
  }

  private branch(): string | undefined {
    if (this.isSupervisor()) {
      const name = this.currentUser.user().branch;
      return name === 'Sucursal Centro' ? 'CENTRO' : name?.replace(/^Sucursal\s+/i, '').toUpperCase();
    }
    return this.filters.controls.branch.value || undefined;
  }

  private query(): DashboardQuery {
    const { from, to } = this.filters.getRawValue();
    return { from: from || undefined, to: to || undefined, branch: this.branch() };
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const problem: unknown = error.error;
      if (typeof problem === 'object' && problem !== null && 'detail' in problem && typeof (problem as ProblemDetail).detail === 'string') {
        return (problem as ProblemDetail).detail;
      }
    }
    return 'No se pudo obtener la información. Intentá nuevamente.';
  }

  applyFilters(): void {
    this.modelPage.set(0);
    this.stockPage.set(0);
    this.transferPage.set(0);
    this.loadSales();
    this.loadModels();
    this.loadStock();
    this.loadTransfers();
  }

  loadSales(): void {
    this.sales.set({ status: 'loading' });
    this.service.getSalesMetrics(this.query()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.sales.set(data.saleCount ? { status: 'ready', data } : { status: 'empty' }),
      error: (error: unknown) => this.sales.set({ status: 'error', message: this.errorMessage(error) })
    });
  }

  loadModels(): void {
    this.models.set({ status: 'loading' });
    this.service.getTopModels({ ...this.query(), page: this.modelPage(), size: 10 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.models.set(data.content.length ? { status: 'ready', data } : { status: 'empty' }),
      error: (error: unknown) => this.models.set({ status: 'error', message: this.errorMessage(error) })
    });
  }

  loadStock(): void {
    this.stock.set({ status: 'loading' });
    this.service.getCriticalStock({ branch: this.branch(), page: this.stockPage(), size: 10 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.stock.set(data.content.length ? { status: 'ready', data } : { status: 'empty' }),
      error: (error: unknown) => this.stock.set({ status: 'error', message: this.errorMessage(error) })
    });
  }

  loadTransfers(): void {
    this.transfers.set({ status: 'loading' });
    this.service.getTransfersInTransit({ branch: this.branch(), page: this.transferPage(), size: 10 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.transfers.set(data.content.length ? { status: 'ready', data } : { status: 'empty' }),
      error: (error: unknown) => this.transfers.set({ status: 'error', message: this.errorMessage(error) })
    });
  }

  changePage(section: 'models' | 'stock' | 'transfers', page: number): void {
    if (page < 0) return;
    if (section === 'models') {
      this.modelPage.set(page);
      this.loadModels();
    } else if (section === 'stock') {
      this.stockPage.set(page);
      this.loadStock();
    } else {
      this.transferPage.set(page);
      this.loadTransfers();
    }
  }
}
