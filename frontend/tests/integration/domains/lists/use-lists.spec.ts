import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '~/domains/auth/infrastructure/auth.store';
import { useLists } from '~/domains/lists/application/use-lists';

describe('useLists integration', () => {
  beforeEach(() => {
    (globalThis as any).__resetNuxtStateStore?.();
  });

  it('blocks list operations while offline', async () => {
    const lists = useLists({
      isOnline: () => false
    });

    await lists.loadLists();
    expect(lists.errorMessage.value).toBe('Mode hors ligne: impossible de charger les listes.');

    const createResult = await lists.createList('Backlog');
    expect(createResult).toBe(false);
    expect(lists.errorMessage.value).toBe('Mode hors ligne: creation de liste indisponible.');

    await lists.deleteList('list-1');
    expect(lists.errorMessage.value).toBe('Mode hors ligne: suppression de liste indisponible.');
  });

  it('creates a list while online', async () => {
    useAuthStore().accessToken = 'access-token';

    const created = {
      id: 'list-2',
      ownerUserId: 'user-1',
      name: 'Backlog',
      createdAt: '2026-07-12T10:00:00.000Z',
      updatedAt: '2026-07-12T10:00:00.000Z'
    };

    const listsApi = {
      getLists: vi.fn(async () => []),
      createList: vi.fn(async () => created),
      deleteList: vi.fn(async () => undefined)
    };

    const lists = useLists({
      isOnline: () => true,
      listsApi
    });

    const createdResult = await lists.createList('Backlog');

    expect(createdResult).toBe(true);
    expect(listsApi.createList).toHaveBeenCalledTimes(1);
    expect(lists.lists.value).toHaveLength(1);
    expect(lists.lists.value[0]?.name).toBe('Backlog');
  });
});
