const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('apiBaseUrl');
    if (storedUrl && storedUrl.startsWith('http')) {
      return storedUrl.replace(/\/$/, '');
    }
  }

  return (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000/api').replace(/\/$/, '');
};

export const getCurrentUserAvatarUrl = (versionKey?: string | null): string => {
  const baseUrl = getApiBaseUrl();
  const version = versionKey ? `?v=${encodeURIComponent(versionKey)}` : '';
  return `${baseUrl}/users/me/avatar${version}`;
};
