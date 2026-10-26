import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CurrentUser } from '../session/current-user';
import { UserRole } from '../session/user-role';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <div class="header-inner">
        <div><strong class="brand">Venta de celulares</strong><span class="subtitle">Tienda y gestión comercial</span></div>
        <div class="identity">
          <span class="user-name">{{ currentUser.user().name }}<span class="branch">{{ currentUser.user().branch ? ' · ' + currentUser.user().branch : '' }}</span></span>
          @if (useMock) {
            <label for="test-role">Rol de prueba</label>
            <select id="test-role" [value]="currentUser.user().role" (change)="changeRole($event)">
              @for (role of roles; track role.value) { <option [value]="role.value">{{ role.label }}</option> }
            </select>
          } @else {
            <span class="role">{{ currentUser.user().role }}</span>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header { background: var(--color-primary); color: var(--color-on-primary); }
    .header-inner { max-width: 1440px; margin: auto; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .brand { font-size: 1.25rem; display: block; }
    .subtitle { display: block; font-size: .875rem; opacity: .9; }
    .identity { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
    .branch { font-size: .875rem; }
    select { max-width: 12rem; padding: .4rem; border-radius: var(--radius); border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); }
    @media (max-width: 600px) { .header-inner { padding: 1rem; } .user-name { width: 100%; } }
  `]
})
export class AppHeader {
  readonly currentUser = inject(CurrentUser);
  readonly useMock = environment.useMock;
  readonly roles: ReadonlyArray<{ value: UserRole; label: string }> = [
    { value: UserRole.CLIENTE, label: 'Cliente' },
    { value: UserRole.VENDEDOR, label: 'Vendedor' },
    { value: UserRole.SUPERVISOR, label: 'Supervisor' },
    { value: UserRole.BACKOFFICE, label: 'Back-office' },
    { value: UserRole.GERENCIA, label: 'Gerencia' }
  ];
  private readonly router = inject(Router);

  changeRole(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const selected = this.roles.find(role => role.value === target.value);
    if (!selected) return;
    this.currentUser.setRole(selected.value);
    const destination = selected.value === UserRole.BACKOFFICE ? '/orders'
      : selected.value === UserRole.GERENCIA ? '/dashboard' : '/catalogo';
    void this.router.navigateByUrl(destination);
  }
}
