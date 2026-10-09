import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';
import { AppIconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <app-icon name="check" [size]="18" /> }
              @case ('error') { <app-icon name="alert-triangle" [size]="18" /> }
              @case ('warning') { <app-icon name="alert-triangle" [size]="18" /> }
              @default { <app-icon name="sparkles" [size]="18" /> }
            }
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Cerrar">
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      width: calc(100% - 2.5rem);
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 0.6rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(8px);
      animation: slideIn 0.25s ease-out;
      font-size: 0.875rem;
      line-height: 1.35;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .toast-icon {
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 700;
      margin-bottom: 0.2rem;
    }

    .toast-message {
      word-break: break-word;
      font-weight: 400;
    }

    .toast-close {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    .toast-close:hover {
      opacity: 1;
    }

    .toast-success {
      background: #14532d;
      color: #f0fdf4;
      border: 1px solid #22c55e;
    }

    .toast-error {
      background: #7f1d1d;
      color: #fef2f2;
      border: 1px solid #ef4444;
    }

    .toast-warning {
      background: #78350f;
      color: #fffbeb;
      border: 1px solid #f59e0b;
    }

    .toast-info {
      background: #1e3a8a;
      color: #eff6ff;
      border: 1px solid #3b82f6;
    }
  `]
})
export class ToastComponent {
  public readonly toastService = inject(ToastService);
}
