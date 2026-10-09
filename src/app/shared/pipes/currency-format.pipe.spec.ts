import { AppCurrencyPipe } from './currency-format.pipe';

describe('AppCurrencyPipe', () => {
  const pipe = new AppCurrencyPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('formats numbers to Argentine currency format correctly', () => {
    const formatted = pipe.transform(1250);
    expect(formatted).toContain('1.250');
  });

  it('handles null or undefined safely', () => {
    expect(pipe.transform(null)).toContain('0,00');
    expect(pipe.transform(undefined)).toContain('0,00');
  });
});
