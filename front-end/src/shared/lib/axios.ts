import axios from 'axios';
import { getApiBaseUrl } from './apiBaseUrl';

const getBaseUrl = (): string => {
  return getApiBaseUrl();
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const responseData = error.response?.data;
    const contentType = error.response?.headers?.['content-type'];

    const isHtmlPayload =
      typeof responseData === 'string' &&
      (responseData.includes('<!DOCTYPE html>') ||
        responseData.includes('<html') ||
        (typeof contentType === 'string' && contentType.includes('text/html')));

    if (typeof window !== 'undefined' && isHtmlPayload && !originalRequest._apiFallbackRetried) {
      originalRequest._apiFallbackRetried = true;
      const fallbackBaseUrl = `${window.location.origin.replace(/\/$/, '')}/api`;
      localStorage.setItem('apiBaseUrl', fallbackBaseUrl);

      if (typeof originalRequest.url === 'string' && originalRequest.url.startsWith('http')) {
        const absolutePath = originalRequest.url.replace(/^https?:\/\/[^/]+/, '');
        originalRequest.url = absolutePath.startsWith('/api/')
          ? absolutePath.replace(/^\/api/, '')
          : absolutePath;
      }

      originalRequest.baseURL = fallbackBaseUrl;
      return axiosInstance(originalRequest);
    }

    const isRefreshUrl = originalRequest.url?.includes('/auth/refresh');

    const isAuthUrl =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/signup') ||
      originalRequest.url?.includes('/auth/user/password');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshUrl && !isAuthUrl) {
      originalRequest._retry = true;

      try {
        await axiosInstance.post('/auth/refresh');
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('리프레시 에러', refreshError);
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
