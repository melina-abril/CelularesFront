import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/role.guard';
import { UserRole } from '../../core/session/user-role';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    canMatch: [roleGuard(UserRole.CLIENTE)],
    loadComponent: () => import('./pages/checkout-page/checkout-page').then(m => m.CheckoutPage)
  }
];
