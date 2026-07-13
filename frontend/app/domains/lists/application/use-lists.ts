import { computed } from 'vue';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import type { ListSummary } from '../domain/list-summary';
import { HttpListsApiAdapter } from '../infrastructure/http-lists-api.adapter';

const LISTS_STATE_KEY = 'tasks-manager.lists.state';
const LISTS_LOADING_KEY = 'tasks-manager.lists.loading';
const LISTS_ERROR_KEY = 'tasks-manager.lists.error';

const listsApi = new HttpListsApiAdapter();

export function useLists() {
  const lists = useState<readonly ListSummary[]>(LISTS_STATE_KEY, () => []);
  const isLoading = useState<boolean>(LISTS_LOADING_KEY, () => false);
  const errorMessage = useState<string>(LISTS_ERROR_KEY, () => '');
  const authSession = useAuthSession();

  function resetError(): void {
    errorMessage.value = '';
  }

  async function loadLists(): Promise<void> {
    resetError();
    isLoading.value = true;

    try {
      const token = authSession.accessToken.value;
      if (token.length === 0) {
        throw new Error('missing-access-token');
      }

      lists.value = await listsApi.getLists(token);
    } catch {
      errorMessage.value = 'Impossible de charger les listes.';
      lists.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function createList(name: string): Promise<boolean> {
    resetError();

    const normalizedName = name.trim();
    if (normalizedName.length === 0) {
      errorMessage.value = 'Le nom de la liste est obligatoire.';
      return false;
    }

    try {
      const token = authSession.accessToken.value;
      if (token.length === 0) {
        throw new Error('missing-access-token');
      }

      const created = await listsApi.createList(token, { name: normalizedName });
      lists.value = [created, ...lists.value];
      return true;
    } catch {
      errorMessage.value = 'Creation impossible (nom deja pris ou session invalide).';
      return false;
    }
  }

  async function deleteList(listId: string): Promise<void> {
    resetError();

    try {
      const token = authSession.accessToken.value;
      if (token.length === 0) {
        throw new Error('missing-access-token');
      }

      await listsApi.deleteList(token, listId);
      lists.value = lists.value.filter((item) => item.id !== listId);
    } catch {
      errorMessage.value = 'Suppression impossible pour cette liste.';
    }
  }

  return {
    lists: computed(() => lists.value),
    isLoading: computed(() => isLoading.value),
    errorMessage: computed(() => errorMessage.value),
    loadLists,
    createList,
    deleteList,
    resetError
  };
}
