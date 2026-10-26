import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/role.guard';
import { UserRole } from '../../core/session/user-role';

export const ORDERS_ROUTES: Routes = [{
  path: '',
  canMatch: [roleGuard(UserRole.VENDEDOR, UserRole.SUPERVISOR, UserRole.BACKOFFICE, UserRole.GERENCIA)],
  children: [
    { path: '', pathMatch: 'full', loadComponent: () => import('./pages/orders-page/orders-page').then(m => m.OrdersPage) },
    { path: ':orderId', loadComponent: () => import('./pages/order-detail-page/order-detail-page').then(m => m.OrderDetailPage) }
  ]
}];
