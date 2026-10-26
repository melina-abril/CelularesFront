import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/role.guard';
import { UserRole } from '../../core/session/user-role';

export const TRADEIN_ROUTES: Routes = [
  {
    path: '',
    canMatch: [roleGuard(UserRole.CLIENTE, UserRole.VENDEDOR, UserRole.SUPERVISOR)],
    loadComponent: () => import('./pages/tradein-page/tradein-page').then(m => m.TradeinPage)
  }
];
