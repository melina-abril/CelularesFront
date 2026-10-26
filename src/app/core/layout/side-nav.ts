import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CurrentUser } from '../session/current-user';
import { UserRole } from '../session/user-role';

interface NavigationItem {
  label: string;
  path: string;
  roles: readonly UserRole[];
}

const { CLIENTE, VENDEDOR, SUPERVISOR, BACKOFFICE, GERENCIA } = UserRole;

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navigation" aria-label="Secciones principales">
      <button type="button" class="menu-toggle" [attr.aria-expanded]="expanded()" aria-controls="navigation-links" (click)="expanded.set(!expanded())">Secciones {{ expanded() ? '▲' : '▼' }}</button>
      <ul id="navigation-links" [class.collapsed]="!expanded()">
        @for (item of items; track item.path) {
          @if (item.roles.includes(currentUser.user().role)) {
            <li><a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }" (click)="expanded.set(false)">{{ item.label }}</a></li>
          }
        }
      </ul>
    </nav>
  `,
  styles: [`
    .navigation { padding: 1.5rem .75rem; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .25rem; }
    a { display: block; color: var(--color-text); text-decoration: none; border-radius: var(--radius); padding: .75rem; }
    a:hover, a.active { background: var(--color-primary-soft); color: var(--color-primary); }
    a.active { font-weight: 700; }
    .menu-toggle { display: none; }
    @media (max-width: 700px) {
      .navigation { padding: .75rem 1rem; border-bottom: 1px solid var(--color-border); }
      .menu-toggle { display: block; width: 100%; text-align: left; background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); border-radius: var(--radius); padding: .65rem; }
      ul { margin-top: .5rem; }
      ul.collapsed { display: none; }
    }
  `]
})
export class SideNav {
  readonly currentUser = inject(CurrentUser);
  readonly expanded = signal(false);
  readonly items: readonly NavigationItem[] = [
    { label: 'Catálogo y stock', path: '/catalogo', roles: [CLIENTE, VENDEDOR, SUPERVISOR] },
    { label: 'Precios y cuotas', path: '/payments', roles: [CLIENTE, VENDEDOR, SUPERVISOR] },
    { label: 'Plan canje', path: '/tradein', roles: [CLIENTE, VENDEDOR, SUPERVISOR] },
    { label: 'Carrito y compra', path: '/checkout', roles: [CLIENTE] },
    { label: 'Venta en mostrador', path: '/counter-sales', roles: [VENDEDOR, SUPERVISOR] },
    { label: 'Pedidos', path: '/orders', roles: [VENDEDOR, SUPERVISOR, BACKOFFICE] },
    { label: 'Garantías', path: '/warranties', roles: [VENDEDOR, SUPERVISOR, BACKOFFICE] },
    { label: 'Tablero comercial', path: '/dashboard', roles: [SUPERVISOR, GERENCIA] }
  ];
}
