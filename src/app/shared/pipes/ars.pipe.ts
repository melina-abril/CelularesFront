import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ars', standalone: true })
export class ArsPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return `$ ${this.formatter.format(value)}`;
  }
}
