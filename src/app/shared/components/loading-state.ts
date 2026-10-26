import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p role="status" aria-live="polite">Cargando información…</p>'
})
export class LoadingState {}
