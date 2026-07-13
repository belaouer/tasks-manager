import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthenticatedApiClient } from '~/shared/http/create-authenticated-api-client';

describe('createAuthenticatedApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retries once after refreshing token on 401', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ ok: true });
    const refreshAccessToken = vi.fn(async () => 'new-token');

    const client = createAuthenticatedApiClient({
      fetcher,
      getAccessToken: () => 'expired-token',
      refreshAccessToken
    });

    await expect(client.requestWithAuth('/lists')).resolves.toEqual({ ok: true });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect((fetcher.mock.calls[0]?.[1]?.headers as Headers | undefined)?.get('authorization')).toBe(
      'Bearer expired-token'
    );
    expect((fetcher.mock.calls[1]?.[1]?.headers as Headers | undefined)?.get('authorization')).toBe(
      'Bearer new-token'
    );
  });

  it('redirects when refresh fails after 401', async () => {
    const fetcher = vi.fn().mockRejectedValue({ response: { status: 401 } });
    const refreshAccessToken = vi.fn(async () => null);
    const redirectToLogin = vi.fn(async () => undefined);

    const client = createAuthenticatedApiClient({
      fetcher,
      getAccessToken: () => 'expired-token',
      refreshAccessToken,
      redirectToLogin
    });

    await expect(client.requestWithAuth('/lists')).rejects.toMatchObject({
      response: { status: 401 }
    });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });
});