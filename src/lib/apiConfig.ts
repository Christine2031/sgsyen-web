const configuredApiUrl = import.meta.env.VITE_SGSYEN_API_URL as string | undefined;

function apiOrigin() {
  const value = configuredApiUrl?.trim();
  if (!value) throw new Error('VITE_SGSYEN_API_URL is not configured');
  const url = new URL(value);
  const isLocal = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
  if (url.protocol !== 'https:' && !isLocal) {
    throw new Error('VITE_SGSYEN_API_URL must use HTTPS outside local development');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_SGSYEN_API_URL must be a clean origin');
  }
  return url.origin;
}

export function sgsyenApiUrl(path: string) {
  if (!path.startsWith('/')) throw new Error('SGSYEN API path must start with /');
  return `${apiOrigin()}${path}`;
}
