import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/role.guard';
import { UserRole } from '../../core/session/user-role';

export const COUNTER_SALES_ROUTES: Routes = [
  {
    path: '',
    canMatch: [roleGuard(UserRole.VENDEDOR, UserRole.SUPERVISOR)],
    loadComponent: () => import('./pages/counter-sale-page/counter-sale-page').then(m => m.CounterSalePage)
  },
  {
    path: 'approvals',
    canMatch: [roleGuard(UserRole.SUPERVISOR)],
    loadComponent: () => import('./pages/discount-approval-page/discount-approval-page').then(m => m.DiscountApprovalPage)
  }
];
