import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { MenuService } from '../core/services/menu.service';
import { InstitucionService } from '../core/services/institucion.service';
import { AppIconComponent } from '../shared/components/icon/icon.component';
import { ToastComponent } from '../shared/components/toast/toast.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIconComponent, ToastComponent],
  template: `
    <div class="app-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar" [class.open]="sidebarAbierto()">
        <div class="sidebar-header">
          <div class="brand-logo">
            @if (institucionService.institucion().logoBase64) {
              <img [src]="'data:image/png;base64,' + institucionService.institucion().logoBase64" alt="Logo" class="logo-img" />
            } @else {
              <div class="logo-icon-box">
                <app-icon name="ice-cream" [size]="24" />
              </div>
            }
          </div>
          <div class="brand-info">
            <span class="brand-name">{{ institucionService.institucion().nombre || 'Heladería Artesanal' }}</span>
            <span class="brand-sub">Sistema POS & Gestión</span>
          </div>
          <button class="mobile-close-btn" (click)="toggleSidebar()" aria-label="Cerrar menú">
            <app-icon name="x" [size]="20" />
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-title">MÓDULOS DEL SISTEMA</div>
          @for (item of menuService.menuItems(); track item.clave) {
            <a 
              [routerLink]="item.ruta" 
              routerLinkActive="active" 
              class="nav-link"
              (click)="onNavClick()"
            >
              <div class="nav-link-icon">
                <app-icon [name]="item.icono" [size]="20" />
              </div>
              <span class="nav-link-text">{{ item.nombre }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="user-avatar">
              <app-icon name="user" [size]="18" />
            </div>
            <div class="user-details">
              <div class="username">{{ authService.username() || 'Usuario' }}</div>
              <div class="user-role-badge">{{ authService.role() }}</div>
            </div>
          </div>

          <div class="footer-actions">
            <button 
              type="button" 
              class="action-btn" 
              (click)="navegarACambiarPassword()" 
              title="Cambiar Contraseña"
            >
              <app-icon name="lock" [size]="16" />
              <span>Contraseña</span>
            </button>
            <button 
              type="button" 
              class="action-btn logout-btn" 
              (click)="cerrarSesion()" 
              title="Cerrar Sesión"
            >
              <app-icon name="log-out" [size]="16" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- BACKDROP PARA MOBILE -->
      @if (sidebarAbierto()) {
        <div class="sidebar-backdrop" (click)="toggleSidebar()"></div>
      }

      <!-- CONTENIDO PRINCIPAL -->
      <div class="main-wrapper">
        <header class="topbar">
          <div class="topbar-left">
            <button class="btn-hamburger" (click)="toggleSidebar()" aria-label="Abrir menú">
              <app-icon name="layout-dashboard" [size]="22" />
            </button>
            <div class="topbar-title">
              {{ institucionService.institucion().nombre || 'Heladería Artesanal' }}
            </div>
          </div>

          <div class="topbar-right">
            <a routerLink="/pos" class="btn btn-primary btn-sm btn-quick-pos">
              <app-icon name="shopping-cart" [size]="16" />
              <span>Abrir POS</span>
            </a>
          </div>
        </header>

        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- TOAST NOTIFICACIONES -->
      <app-toast />
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-app);
    }

    /* SIDEBAR */
    .sidebar {
      width: 260px;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 100;
      border-right: 1px solid #1e293b;
      transition: transform 0.25s ease;
    }

    .sidebar-header {
      padding: 1.25rem 1.25rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid #1e293b;
    }

    .brand-logo {
      flex-shrink: 0;
    }

    .logo-img {
      width: 38px;
      height: 38px;
      object-fit: contain;
      border-radius: 8px;
    }

    .logo-icon-box {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #ffffff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-info {
      flex: 1;
      min-width: 0;
    }

    .brand-name {
      display: block;
      font-weight: 700;
      font-size: 0.9375rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #ffffff;
    }

    .brand-sub {
      display: block;
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .mobile-close-btn {
      display: none;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #64748b;
      padding: 0.5rem 0.75rem 0.25rem;
      text-transform: uppercase;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      color: #94a3b8;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .nav-link:hover {
      background: #1e293b;
      color: #ffffff;
      text-decoration: none;
    }

    .nav-link.active {
      background: #f59e0b;
      color: #0f172a;
      font-weight: 700;
    }

    .nav-link.active .nav-link-icon {
      color: #0f172a;
    }

    .nav-link-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #1e293b;
      background: #090d16;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 0.75rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: #334155;
      color: #f8fafc;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .username {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role-badge {
      font-size: 0.65rem;
      font-weight: 700;
      color: #f59e0b;
      letter-spacing: 0.04em;
    }

    .footer-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.4rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #334155;
      background: #1e293b;
      color: #cbd5e1;
      cursor: pointer;
      transition: background 0.15s;
    }

    .action-btn:hover {
      background: #334155;
      color: #ffffff;
    }

    .logout-btn:hover {
      background: #991b1b;
      border-color: #ef4444;
      color: #ffffff;
    }

    /* MAIN WRAPPER */
    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-width: 0;
    }

    .topbar {
      height: 60px;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-hamburger {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-main);
      padding: 0.25rem;
    }

    .topbar-title {
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--text-main);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-quick-pos {
      box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
    }

    .content-area {
      flex: 1;
      padding: 1.5rem;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
    }

    /* RESPONSIVE */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .sidebar.open {
        transform: translateX(0);
      }
      .main-wrapper {
        margin-left: 0;
      }
      .btn-hamburger {
        display: block;
      }
      .mobile-close-btn {
        display: block;
      }
      .sidebar-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        z-index: 90;
      }
      .content-area {
        padding: 1rem;
      }
    }
  `]
})
export class AppLayoutComponent implements OnInit {
  public readonly authService = inject(AuthService);
  public readonly menuService = inject(MenuService);
  public readonly institucionService = inject(InstitucionService);
  private readonly router = inject(Router);

  public readonly sidebarAbierto = signal<boolean>(false);

  ngOnInit(): void {
    this.menuService.cargarPaginasDisponibles();
    this.institucionService.cargarInstitucion();
  }

  toggleSidebar(): void {
    this.sidebarAbierto.update(v => !v);
  }

  onNavClick(): void {
    if (window.innerWidth <= 1024) {
      this.sidebarAbierto.set(false);
    }
  }

  navegarACambiarPassword(): void {
    this.router.navigate(['/cambiar-password']);
  }

  cerrarSesion(): void {
    this.authService.logout(true);
  }
}
