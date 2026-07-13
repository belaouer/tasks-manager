import type { AccessTokenView } from '~/domains/auth/domain/auth-payloads';
import { useAuthStore } from '~/domains/auth/infrastructure/auth.store';
import { createAuthenticatedApiClient } from '~/shared/http/create-authenticated-api-client';

const AUTH_ROUTES_PATTERN = /\/auth\/(register|login|refresh|logout)(?:$|[/?#])/;

function withAuthorizationHeader(headers: HeadersInit | undefined, token: string): Headers {
  const nextHeaders = new Headers(headers);
  nextHeaders.set('Authorization', `Bearer ${token}`);
  return nextHeaders;
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const apiBaseUrl = import.meta.server ? config.apiBaseUrl : config.public.apiBaseUrl;

  let refreshPromise: Promise<string | null> | null = null;

  const refreshAccessToken = async (): Promise<string | null> => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const response = await $fetch<AccessTokenView>('/auth/refresh', {
          baseURL: apiBaseUrl,
          method: 'POST',
          credentials: 'include'
        });
        authStore.accessToken = response.accessToken;
        return response.accessToken;
      } catch {
        authStore.accessToken = '';
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  const baseApi = $fetch.create({
    baseURL: apiBaseUrl,
    credentials: 'include',
    onRequest({ request, options }) {
      if (AUTH_ROUTES_PATTERN.test(String(request))) {
        return;
      }

      if (authStore.accessToken.length === 0) {
        return;
      }

      options.headers = withAuthorizationHeader(options.headers, authStore.accessToken);
    }
  }) as any;

  const { requestWithAuth } = createAuthenticatedApiClient({
    fetcher: baseApi,
    getAccessToken: () => authStore.accessToken,
    refreshAccessToken,
    redirectToLogin: async () => {
      if (import.meta.client) {
        await navigateTo('/auth/login');
      }
    }
  });

  return {
    provide: {
      api: requestWithAuth as any
    }
  };
});