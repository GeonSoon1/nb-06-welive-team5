const DEFAULT_API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000/api').replace(
  /\/$/,
  '',
);

export const normalizeApiBaseUrl = (raw?: string | null): string => {
  if (!raw) {
    return DEFAULT_API_BASE_URL;
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith('http')) {
    return DEFAULT_API_BASE_URL;
  }

  try {
    const parsed = new URL(trimmed);
    const sanitizedPath = parsed.pathname.replace(/\/$/, '');
    const apiStartIndex = sanitizedPath.indexOf('/api');
    const normalizedPath =
      apiStartIndex >= 0
        ? sanitizedPath.slice(0, apiStartIndex + '/api'.length)
        : '/api';
    return `${parsed.origin}${normalizedPath}`;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('apiBaseUrl');
    if (storedUrl) {
      return normalizeApiBaseUrl(storedUrl);
    }
  }

  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
};
