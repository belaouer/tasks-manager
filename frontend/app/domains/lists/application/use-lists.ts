import { computed } from 'vue';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import type { ListSummary } from '../domain/list-summary';
import { HttpListsApiAdapter } from '../infrastructure/http-lists-api.adapter';
import {
  type PendingListCreateOperation,
  type PendingListDeleteOperation,
  type PendingListMutationOperation,
  useListsStore
} from '../infrastructure/lists.store';
import {
  buildPendingMutationSyncMessage,
  recordPendingMutationSyncFailure,
  recordPendingMutationSyncSuccess
} from '~/shared/sync/mutation-sync';

const listsApi = new HttpListsApiAdapter();

interface UseListsDependencies {
  readonly isOnline?: () => boolean;
  readonly listsApi?: {
    getLists(accessToken: string): Promise<readonly ListSummary[]>;
    createList(accessToken: string, payload: { name: string }): Promise<ListSummary>;
    deleteList(accessToken: string, listId: string): Promise<void>;
  };
}

export function useLists(deps: UseListsDependencies = {}) {
  const store = useListsStore();
  const authSession = useAuthSession();
  const isOnline = deps.isOnline ?? (() => (!import.meta.client ? true : navigator.onLine));
  const listsApiPort = deps.listsApi ?? listsApi;
  let pendingRetryTimer: ReturnType<typeof setTimeout> | null = null;

  function resetError(): void {
    store.errorMessage = '';
  }

  function clearPendingRetryTimer(): void {
    if (pendingRetryTimer) {
      clearTimeout(pendingRetryTimer);
      pendingRetryTimer = null;
    }
  }

  function schedulePendingRetry(): void {
    clearPendingRetryTimer();

    if (store.pendingMutationQueue.length === 0 || store.syncState.nextRetryAt === null) {
      return;
    }

    const delayMs = Math.max(0, new Date(store.syncState.nextRetryAt).getTime() - Date.now());
    pendingRetryTimer = setTimeout(() => {
      pendingRetryTimer = null;
      void flushPendingMutations();
    }, delayMs);
  }

  function createPendingList(name: string, createdAt: string, tempListId: string): ListSummary {
    return {
      id: tempListId,
      ownerUserId: 'pending-offline',
      name,
      createdAt,
      updatedAt: createdAt,
      pendingSync: true
    };
  }

  function enqueuePendingCreate(name: string): ListSummary {
    const normalizedName = name.trim();
    const createdAt = new Date().toISOString();
    const tempListId = `pending-list-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const operation: PendingListCreateOperation = {
      operationId: `op-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      kind: 'create',
      tempListId,
      payload: { name: normalizedName },
      createdAt
    };

    store.pendingMutationQueue = [...store.pendingMutationQueue, operation];
    return createPendingList(normalizedName, createdAt, tempListId);
  }

  function enqueuePendingDelete(listId: string): void {
    const operation: PendingListDeleteOperation = {
      operationId: `op-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      kind: 'delete',
      listId
    };

    store.pendingMutationQueue = [...store.pendingMutationQueue, operation];
  }

  function removePendingCreateIfPresent(listId: string): boolean {
    const existingCreate = store.pendingMutationQueue.find(
      (operation): operation is PendingListCreateOperation =>
        operation.kind === 'create' && operation.tempListId === listId
    );

    if (!existingCreate) {
      return false;
    }

    store.pendingMutationQueue = store.pendingMutationQueue.filter(
      (operation) => !(operation.kind === 'create' && operation.tempListId === listId)
    );
    return true;
  }

  async function refreshListsFromServer(accessToken: string): Promise<void> {
    const refreshed = await listsApiPort.getLists(accessToken);
    const pendingCreates = store.pendingMutationQueue
      .filter((operation): operation is PendingListCreateOperation => operation.kind === 'create')
      .map((operation) =>
        createPendingList(operation.payload.name, operation.createdAt, operation.tempListId)
      );

    store.lists = [...pendingCreates, ...refreshed];
  }

  async function flushPendingMutations(): Promise<void> {
    clearPendingRetryTimer();

    if (!isOnline() || store.pendingMutationQueue.length === 0) {
      return;
    }

    let token = '';
    try {
      token = authSession.accessToken.value;
      if (token.length === 0) {
        throw new Error('missing-access-token');
      }
    } catch {
      store.errorMessage = 'Synchronisation en attente: session invalide.';
      store.syncState = recordPendingMutationSyncFailure(
        store.syncState,
        'Session invalide.',
        false
      );
      return;
    }

    const remainingOperations: PendingListMutationOperation[] = [];
    const createdListIdByTempId = new Map<string, string>();
    const attemptStartedAt = new Date().toISOString();

    store.syncState = {
      ...store.syncState,
      lastAttemptAt: attemptStartedAt
    };

    for (const operation of store.pendingMutationQueue) {
      try {
        if (operation.kind === 'create') {
          const created = await listsApiPort.createList(token, operation.payload);
          createdListIdByTempId.set(operation.tempListId, created.id);
          store.lists = [
            created,
            ...store.lists.filter((item) => item.id !== operation.tempListId)
          ];
          continue;
        }

        const resolvedListId = createdListIdByTempId.get(operation.listId);

        if (resolvedListId) {
          await listsApiPort.deleteList(token, resolvedListId);
          store.lists = store.lists.filter((item) => item.id !== resolvedListId);
          continue;
        }

        if (removePendingCreateIfPresent(operation.listId)) {
          store.lists = store.lists.filter((item) => item.id !== operation.listId);
          continue;
        }

        await listsApiPort.deleteList(token, operation.listId);
        store.lists = store.lists.filter((item) => item.id !== operation.listId);
      } catch {
        remainingOperations.push(operation);
      }
    }

    store.pendingMutationQueue = remainingOperations;

    if (remainingOperations.length > 0) {
      store.syncState = recordPendingMutationSyncFailure(
        store.syncState,
        'Certaines listes restent en attente de synchronisation.',
        true
      );
      store.errorMessage = buildPendingMutationSyncMessage(
        'des listes',
        remainingOperations.length,
        store.syncState
      );
      schedulePendingRetry();
    } else {
      store.syncState = recordPendingMutationSyncSuccess(store.syncState);
      store.errorMessage = '';
    }
  }

  async function loadLists(): Promise<void> {
    resetError();

    if (!isOnline()) {
      store.errorMessage = 'Mode hors ligne: impossible de charger les listes.';
      return;
    }

    store.isLoading = true;

    try {
      const token = authSession.accessToken.value;
      if (token.length === 0) {
        throw new Error('missing-access-token');
      }

      store.lists = await listsApiPort.getLists(token);
    } catch {
      store.errorMessage = 'Impossible de charger les listes.';
      store.lists = [];
    } finally {
      store.isLoading = false;
    }
  }

  async function createList(name: string): Promise<boolean> {
    resetError();

    const normalizedName = name.trim();
    if (normalizedName.length === 0) {
      store.errorMessage = 'Le nom de la liste est obligatoire.';
      return false;
    }

    if (!isOnline()) {
      const pendingList = enqueuePendingCreate(normalizedName);
      store.lists = [pendingList, ...store.lists];
      store.errorMessage = 'Mode hors ligne: liste en attente de synchronisation.';
      return true;
    }

    try {
      const token = authSession.accessToken.value;
      if (token.length === 0) {
        throw new Error('missing-access-token');
      }

      const created = await listsApiPort.createList(token, { name: normalizedName });
      store.lists = [created, ...store.lists];
      return true;
    } catch {
      store.errorMessage = 'Creation impossible (nom deja pris ou session invalide).';
      return false;
    }
  }

  async function deleteList(listId: string): Promise<void> {
    resetError();

    if (!isOnline()) {
      if (removePendingCreateIfPresent(listId)) {
        store.lists = store.lists.filter((item) => item.id !== listId);
        store.errorMessage = store.pendingMutationQueue.length === 0
          ? ''
          : 'Certaines listes restent en attente de synchronisation.';
        return;
      }

      enqueuePendingDelete(listId);

      store.lists = store.lists.filter((item) => item.id !== listId);
      store.errorMessage = 'Mode hors ligne: suppression de liste en attente de synchronisation.';
      return;
    }

    try {
      const token = authSession.accessToken.value;
      if (token.length === 0) {
        throw new Error('missing-access-token');
      }

      await listsApiPort.deleteList(token, listId);
      store.lists = store.lists.filter((item) => item.id !== listId);
    } catch {
      store.errorMessage = 'Suppression impossible pour cette liste.';
    }
  }

  return {
    lists: computed(() => store.lists),
    isLoading: computed(() => store.isLoading),
    errorMessage: computed(() => store.errorMessage),
    syncStatusMessage: computed(() =>
      buildPendingMutationSyncMessage('des listes', store.pendingMutationQueue.length, store.syncState)
    ),
    pendingSyncCount: computed(() => store.pendingMutationQueue.length),
    loadLists,
    createList,
    deleteList,
    flushPendingMutations,
    resetError
  };
}
