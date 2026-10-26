import { Injectable, Signal, signal } from '@angular/core';
import { UserRole } from './user-role';

export interface TestUser {
  name: string;
  role: UserRole;
  branch: string | null;
  token: string | null;
}

@Injectable({ providedIn: 'root' })
export class CurrentUser {
  private readonly userSignal = signal<TestUser>({
    name: 'Cliente de prueba',
    role: UserRole.CLIENTE,
    branch: null,
    token: null
  });

  readonly user: Signal<TestUser> = this.userSignal.asReadonly();

  setRole(role: UserRole): void {
    const names: Record<UserRole, string> = {
      [UserRole.CLIENTE]: 'Cliente de prueba',
      [UserRole.VENDEDOR]: 'Vendedor de prueba',
      [UserRole.SUPERVISOR]: 'Supervisor de prueba',
      [UserRole.BACKOFFICE]: 'Operador de prueba',
      [UserRole.GERENCIA]: 'Gerente de prueba'
    };

    this.userSignal.set({
      name: names[role],
      role,
      branch: role === UserRole.VENDEDOR || role === UserRole.SUPERVISOR ? 'Sucursal Centro' : null,
      token: null
    });
  }
}
