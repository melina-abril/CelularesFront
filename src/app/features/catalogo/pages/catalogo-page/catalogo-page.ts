import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CatalogoFiltros } from '../../components/catalogo-filtros';
import { ModeloCard } from '../../components/modelo-card';
import { CatalogoService } from '../../data-access/catalogo.service';
import { CatalogoFiltro, CatalogoPageResponse } from '../../models/catalogo.models';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';

@Component({
  selector: 'app-catalogo-page', standalone: true,
  imports: [CatalogoFiltros, ModeloCard, ErrorAlert, LoadingState],
  templateUrl: './catalogo-page.html', styleUrl: './catalogo-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogoPage implements OnDestroy {
  private readonly service = inject(CatalogoService);
  private request?: Subscription;
  readonly state = signal<LoadState<CatalogoPageResponse>>({ status: 'loading' });
  readonly filters = signal<CatalogoFiltro>({ marca: null, precioMinimo: 0, precioMaximo: 2000000, memoriaGb: null, condicion: null, sucursal: null, page: 0, size: 20 });

  constructor() { this.load(); }

  apply(filter: CatalogoFiltro): void { this.filters.set(filter); this.load(); }
  goToPage(page: number): void { this.filters.update(filter => ({ ...filter, page })); this.load(); }

  load(): void {
    this.request?.unsubscribe();
    this.state.set({ status: 'loading' });
    this.request = this.service.listModels(this.filters()).subscribe({
      next: data => this.state.set(data.totalElements === 0 ? { status: 'empty' } : { status: 'ready', data }),
      error: (error: unknown) => {
        const detail = error instanceof HttpErrorResponse && typeof error.error?.detail === 'string' ? error.error.detail : 'No se pudo actualizar el catálogo. Intentá nuevamente';
        this.state.set({ status: 'error', message: detail });
      }
    });
  }

  ngOnDestroy(): void { this.request?.unsubscribe(); }
}
