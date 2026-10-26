import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/role.guard';
import { UserRole } from '../../core/session/user-role';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canMatch: [roleGuard(UserRole.SUPERVISOR, UserRole.GERENCIA)],
    loadComponent: () => import('./pages/dashboard-page/dashboard-page').then(module => module.DashboardPage)
  }
];
