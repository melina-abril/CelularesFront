import { Routes } from '@angular/router';

export const CATALOGO_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/catalogo-page/catalogo-page').then(module => module.CatalogoPage) },
  { path: ':modeloId', loadComponent: () => import('./pages/modelo-detalle-page/modelo-detalle-page').then(module => module.ModeloDetallePage) }
];
