import { LoginForm } from '../schema/login.schema';
import axios from 'axios';
import { getApiBaseUrl } from '@/shared/lib/apiBaseUrl';

const getLoginBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return getApiBaseUrl();
  }

  const isLocalHost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalHost) {
    return getApiBaseUrl();
  }

  return `${window.location.origin.replace(/\/$/, '')}/api`;
};

export const postLogin = async (data: LoginForm) => {
  return axios.post(`${getLoginBaseUrl()}/auth/login`, data, { withCredentials: true });
};
