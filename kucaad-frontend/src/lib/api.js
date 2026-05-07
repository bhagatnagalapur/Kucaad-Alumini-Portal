const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://kucaad-alumini-portal.onrender.com';

export function apiUrl(path) {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const safeBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${safeBaseUrl}${safePath}`;
}
