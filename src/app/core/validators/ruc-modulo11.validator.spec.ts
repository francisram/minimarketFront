import { FormControl } from '@angular/forms';
import {
  calcularDigitoVerificadorModulo11,
  validarRucParaguay,
  rucParaguayValidator,
  autocompletarRucDv
} from './ruc-modulo11.validator';

describe('Validador Oficial de RUC - Módulo 11 (SET / DNIT Paraguay)', () => {

  describe('calcularDigitoVerificadorModulo11()', () => {
    it('debe calcular correctamente el DV de RUCs de empresas y sociedades reales', () => {
      // 80123456 -> DV = 5
      expect(calcularDigitoVerificadorModulo11('80123456')).toBe(5);
      // 80012345 -> DV = 0 (suma 122, resto 1 => 0)
      expect(calcularDigitoVerificadorModulo11('80012345')).toBe(0);
      // 44444401 -> DV = 7 (Consumidor Final para facturación electrónica)
      expect(calcularDigitoVerificadorModulo11('44444401')).toBe(7);
    });

    it('debe calcular correctamente el DV de personas físicas / cédulas', () => {
      // 5008432 -> 2*2 + 3*3 + 4*4 + 8*5 + 0*6 + 0*7 + 5*8 = 4 + 9 + 16 + 40 + 0 + 0 + 40 = 109. 109%11=10 => 11-10=1
      expect(calcularDigitoVerificadorModulo11('5008432')).toBe(1);
      // 1234567 -> 7*2 + 6*3 + 5*4 + 4*5 + 3*6 + 2*7 + 1*8 = 14 + 18 + 20 + 20 + 18 + 14 + 8 = 112. 112%11=2 => 11-2=9
      expect(calcularDigitoVerificadorModulo11('1234567')).toBe(9);
    });

    it('debe soportar caracteres alfanuméricos según resolución SET', () => {
      // Cédulas de extranjeros con letras
      const dv = calcularDigitoVerificadorModulo11('A123456');
      expect(typeof dv).toBe('number');
      expect(dv).toBeGreaterThanOrEqual(0);
      expect(dv).toBeLessThanOrEqual(9);
    });

    it('debe retornar 0 para valores vacíos o nulos', () => {
      expect(calcularDigitoVerificadorModulo11('')).toBe(0);
      expect(calcularDigitoVerificadorModulo11('   ')).toBe(0);
    });
  });

  describe('validarRucParaguay()', () => {
    it('debe aceptar RUCs válidos con formato BASE-DV', () => {
      const res = validarRucParaguay('80123456-5');
      expect(res.valido).toBeTrue();
      expect(res.dvCalculado).toBe(5);
      expect(res.dvIngresado).toBe(5);
    });

    it('debe rechazar RUCs con DV incorrecto y retornar el DV esperado', () => {
      const res = validarRucParaguay('80123456-0');
      expect(res.valido).toBeFalse();
      expect(res.dvCalculado).toBe(5);
      expect(res.dvIngresado).toBe(0);
      expect(res.motivo).toContain('Dígito verificador incorrecto');
    });

    it('debe rechazar formatos con más de un guión o caracteres extraños en el DV', () => {
      expect(validarRucParaguay('80-123456-5').valido).toBeFalse();
      expect(validarRucParaguay('80123456-X').valido).toBeFalse();
    });

    it('debe rechazar cédula sin DV si permitirCedulaSinDv es false', () => {
      const res = validarRucParaguay('80123456', false);
      expect(res.valido).toBeFalse();
      expect(res.motivo).toContain('Debe incluir el dígito verificador separado por guión');
    });

    it('debe aceptar cédula sin DV si permitirCedulaSinDv es true', () => {
      const res = validarRucParaguay('80123456', true);
      expect(res.valido).toBeTrue();
      expect(res.dvCalculado).toBe(5);
    });
  });

  describe('rucParaguayValidator() para Reactive Forms', () => {
    it('debe retornar null para control válido', () => {
      const validator = rucParaguayValidator({ permitirCedulaSinDv: false });
      const control = new FormControl('80123456-5');
      expect(validator(control)).toBeNull();
    });

    it('debe retornar rucDigitoInvalido cuando el DV no coincide', () => {
      const validator = rucParaguayValidator();
      const control = new FormControl('80123456-9');
      const errors = validator(control);
      expect(errors).not.toBeNull();
      expect(errors?.['rucDigitoInvalido']?.esperado).toBe(5);
      expect(errors?.['rucDigitoInvalido']?.ingresado).toBe(9);
    });

    it('debe retornar rucFormatoInvalido cuando no contiene guión y no se permite cédula pura', () => {
      const validator = rucParaguayValidator({ permitirCedulaSinDv: false });
      const control = new FormControl('80123456');
      const errors = validator(control);
      expect(errors?.['rucFormatoInvalido']).toBeDefined();
    });

    it('debe permitir control vacío (delega a Validators.required)', () => {
      const validator = rucParaguayValidator();
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });
  });

  describe('autocompletarRucDv()', () => {
    it('debe completar el DV correcto si se pasa solo la base numérica', () => {
      expect(autocompletarRucDv('80123456')).toBe('80123456-5');
      expect(autocompletarRucDv('44444401')).toBe('44444401-7');
    });

    it('debe corregir el DV si se pasa un RUC con DV erróneo', () => {
      expect(autocompletarRucDv('80123456-9')).toBe('80123456-5');
    });
  });
});
