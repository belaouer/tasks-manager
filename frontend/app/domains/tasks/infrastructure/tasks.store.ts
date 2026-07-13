import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CreateTaskPayload, TaskSummary } from '../domain/task-summary';

export interface PendingTaskCreateOperation {
  readonly operationId: string;
  readonly listId: string;
  readonly tempTaskId: string;
  readonly payload: CreateTaskPayload;
  readonly createdAt: string;
}

export const useTasksStore = defineStore('tasks', () => {
  const byList = ref<Record<string, readonly TaskSummary[]>>({});
  const isLoading = ref(false);
  const errorMessage = ref('');
  const pendingCreateQueue = ref<readonly PendingTaskCreateOperation[]>([]);

  return {
    byList,
    isLoading,
    errorMessage,
    pendingCreateQueue
  };
});
