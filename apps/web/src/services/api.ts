import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';

// The API is served under /api/v1. In production nginx proxies that path to
// the backend on the same origin, so the default is relative and no CORS is
// involved; point VITE_API_URL at an absolute URL only when the API lives
// somewhere else.
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Generic API request function
export const apiRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await api(config);
  return response.data;
};
