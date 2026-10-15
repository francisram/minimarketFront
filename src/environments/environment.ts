const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location?.protocol === 'https:') {
      return '';
    }
    if (
      window.location?.port === '8086' ||
      window.location?.port === '8443' ||
      window.location?.port === '80' ||
      window.location?.port === '443'
    ) {
      return '';
    }
    if (window.location?.hostname) {
      return `http://${window.location.hostname}:8085`;
    }
  }
  return 'http://localhost:8085';
};

export const environment = {
  production: false,
  get apiBaseUrl(): string {
    return getApiBaseUrl();
  }
};
