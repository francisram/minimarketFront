const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Si se ejecuta con `ng serve` en desarrollo local (puerto 4200)
    if (window.location?.port === '4200') {
      return 'http://localhost:8085';
    }
    return '';
  }
  return 'http://localhost:8085';
};

export const environment = {
  production: false,
  get apiBaseUrl(): string {
    return getApiBaseUrl();
  }
};
