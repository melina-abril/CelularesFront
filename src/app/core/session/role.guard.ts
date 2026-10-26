import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { CurrentUser } from './current-user';
import { UserRole } from './user-role';

export function roleGuard(...roles: UserRole[]): CanMatchFn {
  return () => {
    const user = inject(CurrentUser);
    const router = inject(Router);
    return roles.includes(user.user().role) ? true : router.parseUrl('/catalogo');
  };
}
