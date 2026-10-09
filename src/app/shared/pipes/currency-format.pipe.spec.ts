import { AppCurrencyPipe } from './currency-format.pipe';

describe('AppCurrencyPipe', () => {
  const pipe = new AppCurrencyPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('formats numbers to Paraguayan Guaraní format correctly without decimals', () => {
    const formatted = pipe.transform(1250);
    expect(formatted).toBe('Gs. 1.250');

    const formattedLarge = pipe.transform(1500000);
    expect(formattedLarge).toBe('Gs. 1.500.000');
  });

  it('handles null or undefined safely', () => {
    expect(pipe.transform(null)).toBe('Gs. 0');
    expect(pipe.transform(undefined)).toBe('Gs. 0');
    expect(pipe.transform('invalid')).toBe('Gs. 0');
  });
});
