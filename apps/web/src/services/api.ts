import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

// The API is served under /api/v1. In production nginx proxies that path to
// the backend on the same origin, so the default is relative and no CORS is
// involved; point VITE_API_URL at an absolute URL only when the API lives
// somewhere else.
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const CSRF_COOKIE = 'criterium_csrf';
const CSRF_HEADER = 'X-CSRF-Token';
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // The session is an httpOnly cookie the browser attaches itself; nothing in
  // this app can read it, which is the point.
  withCredentials: true,
});

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// The session cookie is ambient authority, so every write echoes the readable
// CSRF cookie back in a header for the server's double-submit check.
api.interceptors.request.use(
  (config) => {
    if (UNSAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
      const csrfToken = readCookie(CSRF_COOKIE);
      if (csrfToken) {
        config.headers.set(CSRF_HEADER, csrfToken);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // An expired or rejected session sends the user back to the login screen -
    // but not when the login request itself is what failed, or the form would
    // reload instead of showing "invalid credentials".
    const isAuthRequest = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRequest) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const apiRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await api(config);
  return response.data;
};
