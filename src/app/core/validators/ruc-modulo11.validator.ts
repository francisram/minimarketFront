import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface ResultadoValidacionRuc {
  valido: boolean;
  motivo?: string;
  numeroBase?: string;
  dvIngresado?: number;
  dvCalculado?: number;
}

/**
 * Calcula el Dígito Verificador (DV) según la fórmula oficial de la SET / DNIT de la República del Paraguay.
 *
 * Algoritmo Oficial:
 * - Base máxima: 11.
 * - Factores de ponderación: 2 a 11, aplicados secuencialmente de derecha a izquierda.
 * - Caracteres alfabéticos convertidos a su código ASCII correspondiente.
 * - Resto de la suma acumulada % 11:
 *   - Si resto > 1: DV = 11 - resto.
 *   - Si resto <= 1: DV = 0.
 *
 * @param numeroBase Número o cadena alfanumérica sin guión ni dígito verificador.
 * @returns Dígito verificador calculado (0 a 9).
 */
export function calcularDigitoVerificadorModulo11(numeroBase: string): number {
  if (!numeroBase) return 0;

  const limpio = numeroBase.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (!limpio) return 0;

  let total = 0;
  let factor = 2;
  const baseMax = 11;

  for (let i = limpio.length - 1; i >= 0; i--) {
    if (factor > baseMax) {
      factor = 2;
    }
    const char = limpio.charAt(i);
    const code = char.charCodeAt(0);
    // Si es dígito '0'-'9' (ASCII 48-57) se usa su valor numérico; si es letra, su valor ASCII.
    const valor = (code >= 48 && code <= 57) ? (code - 48) : code;
    total += valor * factor;
    factor++;
  }

  const resto = total % 11;
  return resto > 1 ? (11 - resto) : 0;
}

/**
 * Valida si un RUC o Cédula paraguaya cumple con el formato y el dígito verificador oficial.
 *
 * @param ruc Cadena con formato "BASE-DV" o sólo "BASE".
 * @param permitirCedulaSinDv Si es true, permite ingresar cédulas puras sin guión; si es false, exige formato "BASE-DV".
 */
export function validarRucParaguay(
  ruc: string | null | undefined,
  permitirCedulaSinDv: boolean = false
): ResultadoValidacionRuc {
  if (!ruc || !ruc.trim()) {
    return { valido: false, motivo: 'El RUC no puede estar vacío.' };
  }

  const limpio = ruc.trim();

  // Si contiene guión, debe respetar estrictamente el formato "BASE-DV"
  if (limpio.includes('-')) {
    const partes = limpio.split('-');
    if (partes.length !== 2) {
      return { valido: false, motivo: 'El RUC no debe tener más de un guión separador.' };
    }

    const [base, dvStr] = partes;
    if (!base || !/^[0-9A-Za-z]+$/.test(base)) {
      return { valido: false, motivo: 'La base del RUC contiene caracteres inválidos.' };
    }

    if (!/^\d$/.test(dvStr)) {
      return { valido: false, motivo: 'El dígito verificador debe ser un único número (0-9).' };
    }

    const dvIngresado = parseInt(dvStr, 10);
    const dvCalculado = calcularDigitoVerificadorModulo11(base);

    if (dvIngresado !== dvCalculado) {
      return {
        valido: false,
        motivo: `Dígito verificador incorrecto. El DV para "${base}" debe ser ${dvCalculado}.`,
        numeroBase: base,
        dvIngresado,
        dvCalculado
      };
    }

    return {
      valido: true,
      numeroBase: base,
      dvIngresado,
      dvCalculado
    };
  }

  // Si no contiene guión:
  if (permitirCedulaSinDv) {
    if (!/^[0-9A-Za-z]+$/.test(limpio)) {
      return { valido: false, motivo: 'El número de identificación contiene caracteres inválidos.' };
    }
    const dvCalculado = calcularDigitoVerificadorModulo11(limpio);
    return {
      valido: true,
      numeroBase: limpio,
      dvCalculado
    };
  }

  return {
    valido: false,
    motivo: 'Debe incluir el dígito verificador separado por guión (ej. 80012345-6).',
    numeroBase: limpio,
    dvCalculado: calcularDigitoVerificadorModulo11(limpio)
  };
}

/**
 * Validador reactivo para formularios de Angular (Reactive Forms).
 *
 * @param config Configuración opcional para permitir cédula sin DV.
 */
export function rucParaguayValidator(config?: { permitirCedulaSinDv?: boolean }): ValidatorFn {
  const permitirCedula = config?.permitirCedulaSinDv ?? false;

  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === undefined || String(valor).trim() === '') {
      return null; // 'Validators.required' maneja el campo vacío si corresponde
    }

    const resultado = validarRucParaguay(String(valor), permitirCedula);
    if (resultado.valido) {
      return null;
    }

    if (resultado.dvCalculado !== undefined && resultado.dvIngresado !== undefined) {
      return {
        rucDigitoInvalido: {
          esperado: resultado.dvCalculado,
          ingresado: resultado.dvIngresado,
          numeroBase: resultado.numeroBase,
          mensaje: resultado.motivo
        }
      };
    }

    return {
      rucFormatoInvalido: {
        mensaje: resultado.motivo,
        dvCalculado: resultado.dvCalculado,
        numeroBase: resultado.numeroBase
      }
    };
  };
}

/**
 * Utilidad para completar o corregir automáticamente el RUC con su Dígito Verificador.
 *
 * @param valor Número base o RUC con DV erróneo.
 * @returns RUC formateado como "BASE-DV".
 */
export function autocompletarRucDv(valor: string): string {
  if (!valor) return '';
  const limpio = valor.trim();
  if (limpio.includes('-')) {
    const [base] = limpio.split('-');
    const baseLimpia = base.replace(/[^0-9A-Za-z]/g, '');
    if (!baseLimpia) return valor;
    const dv = calcularDigitoVerificadorModulo11(baseLimpia);
    return `${baseLimpia}-${dv}`;
  }
  const baseLimpia = limpio.replace(/[^0-9A-Za-z]/g, '');
  if (!baseLimpia) return valor;
  const dv = calcularDigitoVerificadorModulo11(baseLimpia);
  return `${baseLimpia}-${dv}`;
}
