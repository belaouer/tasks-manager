import { computed } from 'vue';
import type {
  LoginPayload,
  RegisterPayload
} from '../domain/auth-payloads';
import { HttpAuthApiAdapter } from '../infrastructure/http-auth-api.adapter';
import { StateAuthSessionAdapter } from '../infrastructure/state-auth-session.adapter';

const AUTH_BOOTSTRAPPED_KEY = 'tasks-manager.auth.bootstrapped';

const authApi = new HttpAuthApiAdapter();

export function useAuthSession() {
  const session = new StateAuthSessionAdapter();
  const isBootstrapped = useState<boolean>(AUTH_BOOTSTRAPPED_KEY, () => false);

  async function register(payload: RegisterPayload): Promise<void> {
    const result = await authApi.register(payload);
    session.writeAccessToken(result.accessToken);
  }

  async function login(payload: LoginPayload): Promise<void> {
    const result = await authApi.login(payload);
    session.writeAccessToken(result.accessToken);
  }

  async function refresh(): Promise<boolean> {
    try {
      const result = await authApi.refresh();
      session.writeAccessToken(result.accessToken);
      return true;
    } catch {
      session.clear();
      return false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      session.clear();
    }
  }

  async function ensureBootstrapped(): Promise<void> {
    if (isBootstrapped.value) {
      return;
    }

    await refresh();
    isBootstrapped.value = true;
  }

  async function ensureAuthenticated(): Promise<boolean> {
    if (session.readAccessToken().length > 0) {
      return true;
    }

    await ensureBootstrapped();
    return session.readAccessToken().length > 0;
  }

  return {
    accessToken: computed(() => session.readAccessToken()),
    isAuthenticated: computed(() => session.readAccessToken().length > 0),
    register,
    login,
    refresh,
    logout,
    ensureBootstrapped,
    ensureAuthenticated
  };
}
