import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'cambiar-password',
    loadComponent: () => import('./features/auth/cambiar-password/cambiar-password.component').then(m => m.CambiarPasswordComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.AppLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'pos'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/pedidos/pedidos.component').then(m => m.PedidosComponent)
      },
      {
        path: 'impresoras',
        loadComponent: () => import('./features/impresoras/impresoras.component').then(m => m.ImpresorasComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'institucion',
        loadComponent: () => import('./features/institucion/institucion.component').then(m => m.InstitucionComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'catalogos',
        loadComponent: () => import('./features/catalogos/catalogos.component').then(m => m.CatalogosComponent)
      },
      {
        path: 'catalogos/:seccion',
        loadComponent: () => import('./features/catalogos/catalogos.component').then(m => m.CatalogosComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'pos'
  }
];
