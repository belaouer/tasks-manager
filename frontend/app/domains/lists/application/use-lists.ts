import { computed } from 'vue';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import type { ListSummary } from '../domain/list-summary';
import { HttpListsApiAdapter } from '../infrastructure/http-lists-api.adapter';
import { useListsStore } from '../infrastructure/lists.store';

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

  function resetError(): void {
    store.errorMessage = '';
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

    if (!isOnline()) {
      store.errorMessage = 'Mode hors ligne: creation de liste indisponible.';
      return false;
    }

    const normalizedName = name.trim();
    if (normalizedName.length === 0) {
      store.errorMessage = 'Le nom de la liste est obligatoire.';
      return false;
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
      store.errorMessage = 'Mode hors ligne: suppression de liste indisponible.';
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
    loadLists,
    createList,
    deleteList,
    resetError
  };
}
