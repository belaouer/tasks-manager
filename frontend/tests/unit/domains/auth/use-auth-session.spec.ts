import { beforeEach, describe, expect, it, vi } from 'vitest';

const authApiMock = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn()
}));

vi.mock('~/domains/auth/infrastructure/http-auth-api.adapter', () => ({
  HttpAuthApiAdapter: vi.fn(() => authApiMock)
}));

import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import { useAuthStore } from '~/domains/auth/infrastructure/auth.store';

describe('useAuthSession', () => {
  beforeEach(() => {
    (globalThis as any).__resetNuxtStateStore?.();
    vi.clearAllMocks();
  });

  it('registers and logs in by storing the returned access token', async () => {
    authApiMock.register.mockResolvedValue({ accessToken: 'registered-token' });
    authApiMock.login.mockResolvedValue({ accessToken: 'logged-token' });

    const authSession = useAuthSession();

    await authSession.register({
      email: 'alice@example.com',
      password: 'secret123',
      firstName: 'Alice',
      lastName: 'Martin'
    });

    expect(authApiMock.register).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'secret123',
      firstName: 'Alice',
      lastName: 'Martin'
    });
    expect(authSession.accessToken.value).toBe('registered-token');

    await authSession.login({
      email: 'alice@example.com',
      password: 'secret123'
    });

    expect(authApiMock.login).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'secret123'
    });
    expect(authSession.accessToken.value).toBe('logged-token');
  });

  it('refreshes the session and clears it when refresh fails', async () => {
    authApiMock.refresh.mockResolvedValueOnce({ accessToken: 'refreshed-token' });
    authApiMock.refresh.mockRejectedValueOnce(new Error('refresh failed'));

    const authSession = useAuthSession();

    useAuthStore().accessToken = 'expired-token';

    await expect(authSession.refresh()).resolves.toBe(true);
    expect(authSession.accessToken.value).toBe('refreshed-token');

    await expect(authSession.refresh()).resolves.toBe(false);
    expect(authSession.accessToken.value).toBe('');
  });

  it('bootstraps once and reflects authenticated state from the access token', async () => {
    authApiMock.refresh.mockResolvedValue({ accessToken: 'bootstrapped-token' });

    const authSession = useAuthSession();

    expect(authSession.isAuthenticated.value).toBe(false);

    await expect(authSession.ensureAuthenticated()).resolves.toBe(true);
    expect(authApiMock.refresh).toHaveBeenCalledTimes(1);
    expect(authSession.accessToken.value).toBe('bootstrapped-token');

    await expect(authSession.ensureBootstrapped()).resolves.toBeUndefined();
    expect(authApiMock.refresh).toHaveBeenCalledTimes(1);
  });

  it('logs out and clears the local token even when the API call fails', async () => {
    authApiMock.logout.mockRejectedValueOnce(new Error('logout failed'));

    const authSession = useAuthSession();
    useAuthStore().accessToken = 'current-token';

    await expect(authSession.logout()).rejects.toThrow('logout failed');
    expect(authApiMock.logout).toHaveBeenCalledTimes(1);
    expect(authSession.accessToken.value).toBe('');
  });
});