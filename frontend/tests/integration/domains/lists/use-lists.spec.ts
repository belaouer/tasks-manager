import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '~/domains/auth/infrastructure/auth.store';
import { useLists } from '~/domains/lists/application/use-lists';

describe('useLists integration', () => {
  beforeEach(() => {
    (globalThis as any).__resetNuxtStateStore?.();
  });

  it('queues list operations while offline and updates local state optimistically', async () => {
    const lists = useLists({
      isOnline: () => false
    });

    await lists.loadLists();
    expect(lists.errorMessage.value).toBe('Mode hors ligne: impossible de charger les listes.');

    const createResult = await lists.createList('Backlog');
    expect(createResult).toBe(true);
    expect(lists.errorMessage.value).toBe('Mode hors ligne: liste en attente de synchronisation.');
    expect(lists.lists.value).toHaveLength(1);
    expect(lists.lists.value[0]?.name).toBe('Backlog');
    expect(lists.lists.value[0]?.pendingSync).toBe(true);

    await lists.deleteList(lists.lists.value[0]!.id);
    expect(lists.errorMessage.value).toBe('');
    expect(lists.lists.value).toHaveLength(0);
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

  it('flushes offline queued list mutations when connection is back', async () => {
    let online = false;

    const created = {
      id: 'list-2',
      ownerUserId: 'user-1',
      name: 'Backlog',
      createdAt: '2026-07-12T10:00:00.000Z',
      updatedAt: '2026-07-12T10:00:00.000Z'
    };

    const listsApi = {
      getLists: vi.fn(async () => [created]),
      createList: vi.fn(async () => created),
      deleteList: vi.fn(async () => undefined)
    };

    const lists = useLists({
      isOnline: () => online,
      listsApi
    });

    const queuedCreate = await lists.createList('Backlog');
    expect(queuedCreate).toBe(true);
    expect(lists.lists.value[0]?.pendingSync).toBe(true);

    await lists.deleteList(lists.lists.value[0]!.id);
    expect(lists.lists.value).toHaveLength(0);

    online = true;
    await lists.flushPendingMutations();

    expect(listsApi.createList).not.toHaveBeenCalled();
    expect(listsApi.deleteList).not.toHaveBeenCalled();
    expect(lists.lists.value).toHaveLength(0);
    expect(lists.errorMessage.value).toBe('');
  });

  it('flushes offline delete mutations for already loaded lists', async () => {
    let online = true;

    const initialList = {
      id: 'list-1',
      ownerUserId: 'user-1',
      name: 'Sprint',
      createdAt: '2026-07-12T09:00:00.000Z',
      updatedAt: '2026-07-12T09:00:00.000Z'
    };

    const listsApi = {
      getLists: vi.fn(async () => [initialList]),
      createList: vi.fn(async () => initialList),
      deleteList: vi.fn(async () => undefined)
    };

    const lists = useLists({
      isOnline: () => online,
      listsApi
    });

    useAuthStore().accessToken = 'access-token';

    await lists.loadLists();
    expect(lists.lists.value).toHaveLength(1);

    online = false;
    await lists.deleteList('list-1');

    expect(lists.errorMessage.value).toBe('Mode hors ligne: suppression de liste en attente de synchronisation.');
    expect(lists.lists.value).toHaveLength(0);

    online = true;
    await lists.flushPendingMutations();

    expect(listsApi.deleteList).toHaveBeenCalledTimes(1);
    expect(lists.lists.value).toHaveLength(0);
    expect(lists.errorMessage.value).toBe('');
  });
});
