import { create } from 'zustand';
import { normalizeApiBaseUrl } from '@/shared/lib/apiBaseUrl';

interface ApiUrlState {
  url: string;
  setUrl: (url: string) => void;
  reset: () => void;
}

export const useApiUrlStore = create<ApiUrlState>((set) => {
  let initialUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

  if (typeof window !== 'undefined') {
    initialUrl = normalizeApiBaseUrl(
      localStorage.getItem('apiBaseUrl') || process.env.NEXT_PUBLIC_API_BASE_URL,
    );
  }

  return {
    url: initialUrl,
    setUrl: (url) => {
      const normalizedUrl = normalizeApiBaseUrl(url);
      localStorage.setItem('apiBaseUrl', normalizedUrl);
      set({ url: normalizedUrl });
    },
    reset: () => {
      localStorage.removeItem('apiBaseUrl');
      const defaultUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
      set({ url: defaultUrl });
    },
  };
});
