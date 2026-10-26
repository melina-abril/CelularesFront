import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/role.guard';
import { UserRole } from '../../core/session/user-role';

export const WARRANTIES_ROUTES: Routes = [
  {
    path: '',
    canMatch: [roleGuard(UserRole.VENDEDOR, UserRole.SUPERVISOR, UserRole.BACKOFFICE)],
    loadComponent: () => import('./pages/warranties-page/warranties-page').then(m => m.WarrantiesPage)
  },
  {
    path: ':claimId',
    canMatch: [roleGuard(UserRole.VENDEDOR, UserRole.SUPERVISOR, UserRole.BACKOFFICE)],
    loadComponent: () => import('./pages/warranty-claim-page/warranty-claim-page').then(m => m.WarrantyClaimPage)
  }
];
