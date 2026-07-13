import { computed } from 'vue';
import type {
  LoginPayload,
  RegisterPayload
} from '../domain/auth-payloads';
import { HttpAuthApiAdapter } from '../infrastructure/http-auth-api.adapter';
import { useAuthStore } from '../infrastructure/auth.store';

const authApi = new HttpAuthApiAdapter();

export function useAuthSession() {
  const store = useAuthStore();

  function writeAccessToken(token: string): void {
    store.accessToken = token;
  }

  function clearSession(): void {
    store.accessToken = '';
  }

  async function register(payload: RegisterPayload): Promise<void> {
    const result = await authApi.register(payload);
    writeAccessToken(result.accessToken);
  }

  async function login(payload: LoginPayload): Promise<void> {
    const result = await authApi.login(payload);
    writeAccessToken(result.accessToken);
  }

  async function refresh(): Promise<boolean> {
    try {
      const result = await authApi.refresh();
      writeAccessToken(result.accessToken);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }

  async function ensureBootstrapped(): Promise<void> {
    if (store.isBootstrapped) {
      return;
    }

    await refresh();
    store.isBootstrapped = true;
  }

  async function ensureAuthenticated(): Promise<boolean> {
    if (store.accessToken.length > 0) {
      return true;
    }

    await ensureBootstrapped();
    return store.accessToken.length > 0;
  }

  return {
    accessToken: computed(() => store.accessToken),
    isAuthenticated: computed(() => store.accessToken.length > 0),
    register,
    login,
    refresh,
    logout,
    ensureBootstrapped,
    ensureAuthenticated
  };
}
