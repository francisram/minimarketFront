export type TipoIva = 'IVA_10' | 'IVA_5' | 'EXENTA';

export interface TipoIvaOpcion {
  valor: TipoIva;
  label: string;
  badge: string;
  porcentaje: number;
}

export const OPCIONES_TIPO_IVA: TipoIvaOpcion[] = [
  { valor: 'IVA_10', label: 'IVA 10% (Tasa General)', badge: '10%', porcentaje: 10 },
  { valor: 'IVA_5', label: 'IVA 5% (Canasta Básica)', badge: '5%', porcentaje: 5 },
  { valor: 'EXENTA', label: 'Exentas (0%)', badge: 'Exenta', porcentaje: 0 }
];
