import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ListSummary } from '../domain/list-summary';

export const useListsStore = defineStore('lists', () => {
  const lists = ref<readonly ListSummary[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref('');

  return {
    lists,
    isLoading,
    errorMessage
  };
});
