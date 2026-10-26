import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArsPipe } from '../../../shared/pipes/ars.pipe';
import { ModeloResumenResponse } from '../models/catalogo.models';

@Component({
  selector: 'app-modelo-card', standalone: true, imports: [RouterLink, ArsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <img [src]="model().fotoUrl" [alt]="model().marca + ' ' + model().modelo" width="180" height="180">
      <div><h2>{{ model().marca }} {{ model().modelo }}</h2>
        <p>{{ model().condicion === 'NUEVO' ? 'Nuevo' : 'Reacondicionado grado ' + model().grado }} · {{ model().color }} · {{ model().memoriaGb }} GB</p>
        <p><strong>{{ model().precioContado | ars }}</strong></p>
        <p>@switch (model().estadoStock) { @case ('SIN_STOCK') { Sin stock } @case ('ULTIMAS_UNIDADES') { Últimas unidades } @default { En stock } } · {{ model().sucursalesConStock }} sucursales</p>
        @if (model().cantidadTotal !== null) { <p>Unidades disponibles: {{ model().cantidadTotal }}</p> }
        <a [routerLink]="['/catalogo', model().modeloId]">Ver ficha y disponibilidad</a>
      </div>
    </article>
  `,
  styles: [`
    .card { display: flex; gap: 1rem; padding: 1rem; border: 1px solid var(--color-border, #bbc5d0); border-radius: .75rem; background: var(--color-surface, #fff); height: 100%; box-sizing: border-box; }
    img { width: 100px; height: 100px; object-fit: contain; } h2 { margin: 0; font-size: 1.2rem; } p { margin: .5rem 0; } a { color: var(--color-primary, #164e87); }
    @media (max-width: 400px) { .card { flex-direction: column; } }
  `]
})
export class ModeloCard {
  readonly model = input.required<ModeloResumenResponse>();
}
