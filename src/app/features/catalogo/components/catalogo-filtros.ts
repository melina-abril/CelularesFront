import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoFiltro, Condicion, SUCURSALES, Sucursal } from '../models/catalogo.models';
import { CATALOGO_BRANDS, CATALOGO_MEMORIES } from '../data-access/catalogo.mock';

@Component({
  selector: 'app-catalogo-filtros', standalone: true, imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="apply()" class="filters">
      <label>Marca<select formControlName="marca"><option value="">Todas</option>@for (brand of brands; track brand) { <option [value]="brand">{{ brand }}</option> }</select></label>
      <label>Precio mínimo<input type="number" min="0" step="1" formControlName="precioMinimo"></label>
      <label>Precio máximo<input type="number" min="0" step="1" formControlName="precioMaximo"></label>
      <label>Memoria<select formControlName="memoriaGb"><option value="">Todas</option>@for (memory of memories; track memory) { <option [value]="memory">{{ memory }} GB</option> }</select></label>
      <label>Condición<select formControlName="condicion"><option value="">Todas</option><option value="NUEVO">Nuevo</option><option value="REACONDICIONADO">Reacondicionado</option></select></label>
      <label>Sucursal con stock<select formControlName="sucursal"><option value="">Todas</option>@for (branch of branches; track branch.value) { <option [value]="branch.value">{{ branch.label }}</option> }</select></label>
      <button type="submit">Aplicar filtros</button>
      @if (invalidRange) { <p role="alert" class="validation">Ingresá un rango de precios válido</p> }
    </form>
  `,
  styles: [`
    .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 1rem; padding: 1rem; background: var(--color-surface, #fff); border-radius: .75rem; }
    label { display: grid; gap: .35rem; } select, input { width: 100%; padding: .6rem; border: 1px solid var(--color-border, #bbc5d0); border-radius: .4rem; background: var(--color-surface, #fff); color: inherit; }
    button { align-self: end; padding: .7rem; cursor: pointer; } .validation { color: var(--color-danger, #a32727); grid-column: 1 / -1; margin: 0; }
  `]
})
export class CatalogoFiltros {
  readonly applied = output<CatalogoFiltro>();
  readonly brands = CATALOGO_BRANDS;
  readonly memories = CATALOGO_MEMORIES;
  readonly branches = SUCURSALES;
  readonly form = new FormBuilder().nonNullable.group({
    marca: '', precioMinimo: this.numberField(0), precioMaximo: this.numberField(2000000),
    memoriaGb: '', condicion: '', sucursal: ''
  });
  invalidRange = false;

  private numberField(value: number) {
    return new FormBuilder().nonNullable.control<number | null>(value, { validators: [Validators.min(0)] });
  }

  apply(): void {
    const value = this.form.getRawValue();
    const min = value.precioMinimo;
    const max = value.precioMaximo;
    this.invalidRange = this.form.invalid || min === null || max === null || !Number.isFinite(min) || !Number.isFinite(max) || min > max;
    if (this.invalidRange) return;
    this.applied.emit({
      marca: value.marca || null, precioMinimo: min, precioMaximo: max,
      memoriaGb: value.memoriaGb ? Number(value.memoriaGb) : null,
      condicion: value.condicion ? value.condicion as Condicion : null,
      sucursal: value.sucursal ? value.sucursal as Sucursal : null, page: 0, size: 20
    });
  }
}
