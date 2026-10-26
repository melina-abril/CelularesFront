import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div role="alert" class="error-alert"><strong>Error:</strong> {{ message() }}</div>',
  styles: [`.error-alert { padding: 1rem; border: 1px solid var(--color-danger, #a32727); border-radius: .5rem; color: var(--color-danger, #a32727); }`]
})
export class ErrorAlert {
  readonly message = input.required<string>();
}
