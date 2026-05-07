const API_URL = import.meta.env.VITE_API_URL

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

