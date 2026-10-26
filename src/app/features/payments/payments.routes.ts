import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/role.guard';
import { UserRole } from '../../core/session/user-role';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    canMatch: [roleGuard(UserRole.CLIENTE, UserRole.VENDEDOR, UserRole.SUPERVISOR)],
    loadComponent: () => import('./pages/payments-page/payments-page').then(m => m.PaymentsPage)
  },
  {
    path: ':variantId',
    canMatch: [roleGuard(UserRole.CLIENTE, UserRole.VENDEDOR, UserRole.SUPERVISOR)],
    loadComponent: () => import('./pages/payments-page/payments-page').then(m => m.PaymentsPage)
  }
];
