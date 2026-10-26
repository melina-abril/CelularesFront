import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogoService } from '../../data-access/catalogo.service';
import { ModeloDetalleResponse, SUCURSALES, VarianteDetalle } from '../../models/catalogo.models';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { ArsPipe } from '../../../../shared/pipes/ars.pipe';

@Component({
  selector: 'app-modelo-detalle-page', standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorAlert, LoadingState, ArsPipe],
  templateUrl: './modelo-detalle-page.html', styleUrl: './modelo-detalle-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModeloDetallePage implements OnDestroy {
  private readonly service = inject(CatalogoService);
  private readonly route = inject(ActivatedRoute);
  private detailRequest?: Subscription;
  private alertRequest?: Subscription;
  readonly state = signal<LoadState<ModeloDetalleResponse>>({ status: 'loading' });
  readonly alertState = signal<LoadState<string>>({ status: 'empty' });
  readonly selectedColor = signal('');
  readonly selectedMemory = signal<number | null>(null);
  readonly branches = SUCURSALES;
  readonly alertForm = new FormBuilder().nonNullable.group({ correo: ['', [Validators.required, Validators.email]] });
  readonly colors = computed(() => {
    const current = this.state();
    return current.status === 'ready' ? [...new Set(current.data.variantes.map(item => item.color))] : [];
  });
  readonly memories = computed(() => {
    const current = this.state();
    return current.status === 'ready' ? [...new Set(current.data.variantes.filter(item => item.color === this.selectedColor()).map(item => item.memoriaGb))].sort((a, b) => a - b) : [];
  });
  readonly variant = computed<VarianteDetalle | null>(() => {
    const current = this.state();
    return current.status === 'ready' ? current.data.variantes.find(item => item.color === this.selectedColor() && item.memoriaGb === this.selectedMemory()) ?? null : null;
  });
  readonly emailInvalid = signal(false);

  constructor() { this.load(); }

  load(): void {
    this.detailRequest?.unsubscribe();
    this.state.set({ status: 'loading' });
    this.alertState.set({ status: 'empty' });
    const id = this.route.snapshot.paramMap.get('modeloId');
    if (!id) { this.state.set({ status: 'error', message: 'No se pudo actualizar el catálogo. Intentá nuevamente' }); return; }
    this.detailRequest = this.service.getModelDetail(id).subscribe({
      next: data => {
        this.selectedColor.set(data.variantes[0]?.color ?? '');
        this.selectedMemory.set(data.variantes[0]?.memoriaGb ?? null);
        this.state.set(data.variantes.length ? { status: 'ready', data } : { status: 'empty' });
      },
      error: () => this.state.set({ status: 'error', message: 'No se pudo actualizar el catálogo. Intentá nuevamente' })
    });
  }

  changeColor(color: string): void {
    this.selectedColor.set(color);
    const current = this.state();
    this.selectedMemory.set(current.status === 'ready' ? current.data.variantes.find(item => item.color === color)?.memoriaGb ?? null : null);
    this.alertState.set({ status: 'empty' });
  }

  changeMemory(value: string): void { this.selectedMemory.set(Number(value)); this.alertState.set({ status: 'empty' }); }

  createAlert(): void {
    const current = this.state();
    const selected = this.variant();
    this.emailInvalid.set(this.alertForm.invalid);
    if (this.alertForm.invalid || !selected || current.status !== 'ready' || selected.estadoStock !== 'SIN_STOCK') return;
    this.alertRequest?.unsubscribe();
    this.alertState.set({ status: 'loading' });
    this.alertRequest = this.service.createStockAlert({ modeloId: current.data.modeloId, sku: selected.sku, correo: this.alertForm.getRawValue().correo.trim() }).subscribe({
      next: () => this.alertState.set({ status: 'ready', data: 'Aviso creado para esta variante' }),
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.load();
          this.alertState.set({ status: 'ready', data: 'Esta variante ya tiene stock disponible' });
        } else {
          this.alertState.set({ status: 'error', message: 'No se pudo crear el aviso. Intentá nuevamente' });
        }
      }
    });
  }

  branchName(value: string): string { return this.branches.find(item => item.value === value)?.label ?? value; }
  ngOnDestroy(): void { this.detailRequest?.unsubscribe(); this.alertRequest?.unsubscribe(); }
}
