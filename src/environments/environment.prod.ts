const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8085`;
  }
  return 'http://localhost:8085';
};

export const environment = {
  production: true,
  get apiBaseUrl(): string {
    return getApiBaseUrl();
  }
};
