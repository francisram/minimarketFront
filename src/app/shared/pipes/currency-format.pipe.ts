import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appCurrency',
  standalone: true
})
export class AppCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return 'Gs. 0';
    }
    const num = Math.round(Number(value));
    const formatted = new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(num));

    return num < 0 ? `-Gs. ${formatted}` : `Gs. ${formatted}`;
  }
}
