import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ListSummary } from '../domain/list-summary';
import {
  createInitialPendingMutationSyncState,
  type PendingMutationSyncState
} from '~/shared/sync/mutation-sync';

export interface PendingListCreateOperation {
  readonly operationId: string;
  readonly kind: 'create';
  readonly tempListId: string;
  readonly payload: { readonly name: string };
  readonly createdAt: string;
}

export interface PendingListDeleteOperation {
  readonly operationId: string;
  readonly kind: 'delete';
  readonly listId: string;
}

export type PendingListMutationOperation =
  | PendingListCreateOperation
  | PendingListDeleteOperation;

export const useListsStore = defineStore('lists', () => {
  const lists = ref<readonly ListSummary[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref('');
  const pendingMutationQueue = ref<readonly PendingListMutationOperation[]>([]);
  const syncState = ref<PendingMutationSyncState>(createInitialPendingMutationSyncState());

  return {
    lists,
    isLoading,
    errorMessage,
    pendingMutationQueue,
    syncState
  };
});
