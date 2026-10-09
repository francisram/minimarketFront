import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string, duration: number = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, message, title, duration };
    this._toasts.update(list => [...list, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, title?: string, duration: number = 3500): void {
    this.show(message, 'success', title || 'Operación Exitosa', duration);
  }

  error(message: string, title?: string, duration: number = 6000): void {
    this.show(message, 'error', title || 'Error', duration);
  }

  warning(message: string, title?: string, duration: number = 4000): void {
    this.show(message, 'warning', title || 'Atención', duration);
  }

  info(message: string, title?: string, duration: number = 3500): void {
    this.show(message, 'info', title || 'Información', duration);
  }

  remove(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}
