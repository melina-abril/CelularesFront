import { Routes } from '@angular/router';
import { roleGuard } from './core/session/role.guard';
import { UserRole } from './core/session/user-role';

const { CLIENTE, VENDEDOR, SUPERVISOR, BACKOFFICE, GERENCIA } = UserRole;

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalogo' },
  {
    path: 'catalogo',
    canMatch: [roleGuard(CLIENTE, VENDEDOR, SUPERVISOR)],
    loadChildren: () => import('./features/catalogo/catalogo.routes').then(m => m.CATALOGO_ROUTES)
  },
  {
    path: 'payments',
    canMatch: [roleGuard(CLIENTE, VENDEDOR, SUPERVISOR)],
    loadChildren: () => import('./features/payments/payments.routes').then(m => m.PAYMENTS_ROUTES)
  },
  {
    path: 'tradein',
    canMatch: [roleGuard(CLIENTE, VENDEDOR, SUPERVISOR)],
    loadChildren: () => import('./features/tradein/tradein.routes').then(m => m.TRADEIN_ROUTES)
  },
  {
    path: 'checkout',
    canMatch: [roleGuard(CLIENTE)],
    loadChildren: () => import('./features/checkout/checkout.routes').then(m => m.CHECKOUT_ROUTES)
  },
  {
    path: 'counter-sales',
    canMatch: [roleGuard(VENDEDOR, SUPERVISOR)],
    loadChildren: () => import('./features/counter-sales/counter-sales.routes').then(m => m.COUNTER_SALES_ROUTES)
  },
  {
    path: 'orders',
    canMatch: [roleGuard(VENDEDOR, SUPERVISOR, BACKOFFICE)],
    loadChildren: () => import('./features/orders/orders.routes').then(m => m.ORDERS_ROUTES)
  },
  {
    path: 'warranties',
    canMatch: [roleGuard(VENDEDOR, SUPERVISOR, BACKOFFICE)],
    loadChildren: () => import('./features/warranties/warranties.routes').then(m => m.WARRANTIES_ROUTES)
  },
  {
    path: 'dashboard',
    canMatch: [roleGuard(SUPERVISOR, GERENCIA)],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  { path: '**', redirectTo: 'catalogo' }
];
