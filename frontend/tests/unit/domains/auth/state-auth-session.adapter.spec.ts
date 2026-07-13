import { beforeEach, describe, expect, it } from 'vitest';
import { StateAuthSessionAdapter } from '~/domains/auth/infrastructure/state-auth-session.adapter';

describe('StateAuthSessionAdapter', () => {
  beforeEach(() => {
    (globalThis as any).__resetNuxtStateStore?.();
  });

  it('reads, writes and clears the token from Nuxt state', () => {
    const adapter = new StateAuthSessionAdapter();

    expect(adapter.readAccessToken()).toBe('');

    adapter.writeAccessToken('access-token');
    expect(adapter.readAccessToken()).toBe('access-token');

    adapter.clear();
    expect(adapter.readAccessToken()).toBe('');
  });
});