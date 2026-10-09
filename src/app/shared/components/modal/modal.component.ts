import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-card" [ngClass]="'modal-' + size()" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ title() }}</h3>
            <button type="button" class="btn-close" (click)="close.emit()" aria-label="Cerrar">
              <app-icon name="x" [size]="20" />
            </button>
          </div>
          <div class="modal-body">
            <ng-content select="[body]"></ng-content>
          </div>
          <div class="modal-footer">
            <ng-content select="[footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-card {
      background: var(--bg-surface, #ffffff);
      color: var(--text-main, #0f172a);
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      width: 100%;
      border: 1px solid var(--border-color, #e2e8f0);
      overflow: hidden;
    }

    .modal-sm { max-width: 400px; }
    .modal-md { max-width: 540px; }
    .modal-lg { max-width: 760px; }
    .modal-xl { max-width: 960px; }

    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-main, #0f172a);
    }

    .btn-close {
      background: none;
      border: none;
      padding: 0.35rem;
      border-radius: 0.375rem;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .btn-close:hover {
      background: var(--bg-hover, #f1f5f9);
      color: var(--text-main, #0f172a);
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      background: var(--bg-subtle, #f8fafc);
    }
  `]
})
export class AppModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Modal');
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  closeOnBackdrop = input<boolean>(true);

  close = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }
}
