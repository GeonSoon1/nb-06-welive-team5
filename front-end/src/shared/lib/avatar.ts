import { getApiBaseUrl } from './apiBaseUrl';

export const getCurrentUserAvatarUrl = (avatar?: string | null): string => {
  const baseUrl = getApiBaseUrl();
  const version = avatar ? `?v=${encodeURIComponent(avatar)}` : '';
  return `${baseUrl}/users/me/avatar${version}`;
};
