import axios from 'axios';
import { navigate } from '../utils/navigation';

const resolvedBaseUrl =
  (process.env.NEXT_PUBLIC_API_BASE_URL as string)?.trim() || 'https://bookit-backend-es10.onrender.com/';

const apiClient = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Response interceptor: handle common API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
