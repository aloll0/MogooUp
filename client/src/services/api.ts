import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

// Storage Keys
const ACCESS_TOKEN_KEY = "mogoo_access_token";
const REFRESH_TOKEN_KEY = "mogoo_refresh_token";

let inMemoryAccessToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }
};

export const getAccessToken = () => {
  return inMemoryAccessToken || (typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null);
};

export const setRefreshToken = (token: string | null) => {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
};

export const getRefreshToken = () => {
  return typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
};

// Create configured Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // Send HTTP-only cookies (refresh token) automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Inject Access Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = inMemoryAccessToken || (typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Token Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If request fails due to expired access token (401) and hasn't been retried yet
    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue this request while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = getRefreshToken();
        // Post request to refresh token endpoint with cookie + body/header fallback
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          {
            withCredentials: true,
            headers: storedRefreshToken ? { "x-refresh-token": storedRefreshToken } : undefined,
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        setAccessToken(accessToken);
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken);
        }

        processQueue(null, accessToken);
        isRefreshing = false;

        // Resubmit the original request with the new access token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken(null);
        setRefreshToken(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("mogoo_user");
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
