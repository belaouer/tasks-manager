import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CreateTaskPayload, TaskSummary } from '../domain/task-summary';

export interface PendingTaskCreateOperation {
  readonly operationId: string;
  readonly kind: 'create';
  readonly listId: string;
  readonly tempTaskId: string;
  readonly payload: CreateTaskPayload;
  readonly createdAt: string;
}

export interface PendingTaskStatusOperation {
  readonly operationId: string;
  readonly kind: 'complete' | 'reopen' | 'delete';
  readonly listId: string;
  readonly taskId: string;
}

export type PendingTaskMutationOperation =
  | PendingTaskCreateOperation
  | PendingTaskStatusOperation;

export const useTasksStore = defineStore('tasks', () => {
  const byList = ref<Record<string, readonly TaskSummary[]>>({});
  const isLoading = ref(false);
  const errorMessage = ref('');
  const pendingMutationQueue = ref<readonly PendingTaskMutationOperation[]>([]);

  return {
    byList,
    isLoading,
    errorMessage,
    pendingMutationQueue
  };
});
