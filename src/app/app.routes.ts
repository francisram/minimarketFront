import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, permissionGuard } from './core/guards/role.guard';

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
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent),
        canActivate: [permissionGuard('pedidos')]
      },
      {
        path: 'caja',
        loadComponent: () => import('./features/caja/caja.component').then(m => m.CajaComponent),
        canActivate: [permissionGuard('caja')]
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/pedidos/pedidos.component').then(m => m.PedidosComponent),
        canActivate: [permissionGuard('pedidos')]
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent),
        canActivate: [permissionGuard('clientes')]
      },
      {
        path: 'impresoras',
        loadComponent: () => import('./features/impresoras/impresoras.component').then(m => m.ImpresorasComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'stock',
        loadComponent: () => import('./features/stock/stock.component').then(m => m.StockComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/admin/roles/roles.component').then(m => m.RolesComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'licencia',
        loadComponent: () => import('./features/admin/licencia/licencia.component').then(m => m.LicenciaComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'institucion',
        loadComponent: () => import('./features/institucion/institucion.component').then(m => m.InstitucionComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'backup',
        loadComponent: () => import('./features/admin/backup/backup.component').then(m => m.BackupComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'catalogos',
        loadComponent: () => import('./features/catalogos/catalogos.component').then(m => m.CatalogosComponent)
      },
      {
        path: 'catalogos/:seccion',
        loadComponent: () => import('./features/catalogos/catalogos.component').then(m => m.CatalogosComponent)
      },
      {
        path: 'sabores',
        redirectTo: 'catalogos/sabores'
      },
      {
        path: 'presentaciones',
        redirectTo: 'catalogos/presentaciones'
      },
      {
        path: 'toppings',
        redirectTo: 'catalogos/toppings'
      },
      {
        path: 'productos',
        redirectTo: 'catalogos/productos'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
