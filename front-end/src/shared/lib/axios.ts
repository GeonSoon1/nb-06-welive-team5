import axios from 'axios';
import { getApiBaseUrl } from './apiBaseUrl';

const getBaseUrl = (): string => {
  return getApiBaseUrl();
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
