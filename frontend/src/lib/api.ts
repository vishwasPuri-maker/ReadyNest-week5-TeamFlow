import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // send refresh-token cookie
});

// In-memory access token (kept out of localStorage to reduce XSS exposure).
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('hasSession', '1');
    else localStorage.removeItem('hasSession');
  }
}
export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On 401, try a single refresh, then replay the original request.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      try {
        refreshing ??= refreshAccessToken();
        const newToken = await refreshing;
        refreshing = null;
        if (newToken) {
          original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
          return api(original);
        }
      } catch {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = data.data.accessToken as string;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
}
