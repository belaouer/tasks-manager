import { computed } from 'vue';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import type { CreateTaskPayload, TaskSummary } from '../domain/task-summary';
import type { TaskDeletedEvent } from '../domain/tasks-realtime-events';
import { HttpTasksApiAdapter } from '../infrastructure/http-tasks-api.adapter';
import {
  type PendingTaskCreateOperation,
  type PendingTaskMutationOperation,
  useTasksStore
} from '../infrastructure/tasks.store';
const HTTP_CONFLICT_STATUS = 409;

interface UseTasksDependencies {
  readonly getAccessToken?: () => string;
  readonly isOnline?: () => boolean;
  readonly tasksApi?: {
    getListTasks(accessToken: string, listId: string): Promise<readonly TaskSummary[]>;
    createTask(
      accessToken: string,
      listId: string,
      payload: CreateTaskPayload
    ): Promise<TaskSummary>;
    completeTask(accessToken: string, listId: string, taskId: string): Promise<TaskSummary>;
    reopenTask(accessToken: string, listId: string, taskId: string): Promise<TaskSummary>;
    deleteTask(accessToken: string, listId: string, taskId: string): Promise<void>;
  };
}

const defaultApi = new HttpTasksApiAdapter();

export function useTasks(deps: UseTasksDependencies = {}) {
  const store = useTasksStore();

  const getAccessToken =
    deps.getAccessToken ??
    (() => {
      const authSession = useAuthSession();
      return authSession.accessToken.value;
    });
  const isOnline = deps.isOnline ?? (() => (!import.meta.client ? true : navigator.onLine));
  const tasksApi = deps.tasksApi ?? defaultApi;

  function resetError(): void {
    store.errorMessage = '';
  }

  function readListTasks(listId: string): readonly TaskSummary[] {
    return store.byList[listId] ?? [];
  }

  function writeListTasks(listId: string, tasks: readonly TaskSummary[]): void {
    store.byList = {
      ...store.byList,
      [listId]: tasks
    };
  }

  function getRequiredToken(): string {
    const token = getAccessToken();
    if (token.length === 0) {
      throw new Error('missing-access-token');
    }

    return token;
  }

  function createPendingTask(
    listId: string,
    payload: CreateTaskPayload,
    createdAt: string,
    tempTaskId: string
  ): TaskSummary {
    return {
      id: tempTaskId,
      ownerUserId: 'pending-offline',
      listId,
      shortDescription: payload.shortDescription,
      longDescription: payload.longDescription,
      dueDate: payload.dueDate,
      completedAt: null,
      createdAt,
      updatedAt: createdAt,
      pendingSync: true
    };
  }

  function enqueuePendingCreate(listId: string, payload: CreateTaskPayload): TaskSummary {
    const timestamp = new Date().toISOString();
    const tempTaskId = `pending-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const operation: PendingTaskCreateOperation = {
      operationId: `op-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      kind: 'create',
      listId,
      tempTaskId,
      payload,
      createdAt: timestamp
    };

    store.pendingMutationQueue = [...store.pendingMutationQueue, operation];
    return createPendingTask(listId, payload, timestamp, tempTaskId);
  }

  function enqueuePendingStatusMutation(
    kind: 'complete' | 'reopen' | 'delete',
    listId: string,
    taskId: string
  ): PendingTaskMutationOperation {
    const operation: PendingTaskMutationOperation = {
      operationId: `op-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      kind,
      listId,
      taskId
    };

    store.pendingMutationQueue = [...store.pendingMutationQueue, operation];
    return operation;
  }

  function isConflictError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as {
      status?: unknown;
      statusCode?: unknown;
      response?: { status?: unknown };
      data?: { statusCode?: unknown };
    };

    return (
      candidate.status === HTTP_CONFLICT_STATUS ||
      candidate.statusCode === HTTP_CONFLICT_STATUS ||
      candidate.response?.status === HTTP_CONFLICT_STATUS ||
      candidate.data?.statusCode === HTTP_CONFLICT_STATUS
    );
  }

  async function refreshListFromServer(accessToken: string, listId: string): Promise<void> {
    const refreshed = await tasksApi.getListTasks(accessToken, listId);
    const pendingTasks = store.pendingMutationQueue
      .filter(
        (operation): operation is PendingTaskCreateOperation =>
          operation.kind === 'create' && operation.listId === listId
      )
      .map((operation) =>
        createPendingTask(listId, operation.payload, operation.createdAt, operation.tempTaskId)
      );

    writeListTasks(listId, [...pendingTasks, ...refreshed]);
  }

  function applyOptimisticStatusMutation(
    kind: 'complete' | 'reopen' | 'delete',
    listId: string,
    taskId: string
  ): void {
    if (kind === 'delete') {
      writeListTasks(
        listId,
        readListTasks(listId).filter((task) => task.id !== taskId)
      );
      return;
    }

    writeListTasks(
      listId,
      readListTasks(listId).map((task) =>
        task.id === taskId
          ? {
              ...task,
              completedAt: kind === 'complete' ? task.completedAt ?? new Date().toISOString() : null,
              pendingSync: true
            }
          : task
      )
    );
  }

  async function flushPendingMutations(): Promise<void> {
    if (!isOnline() || store.pendingMutationQueue.length === 0) {
      return;
    }

    let token = '';
    try {
      token = getRequiredToken();
    } catch {
      store.errorMessage = 'Synchronisation en attente: session invalide.';
      return;
    }

    const remainingOperations: PendingTaskCreateOperation[] = [];

    for (const operation of store.pendingMutationQueue) {
      try {
        if (operation.kind === 'create') {
          const created = await tasksApi.createTask(token, operation.listId, operation.payload);
          const currentTasks = readListTasks(operation.listId);
          writeListTasks(
            operation.listId,
            [created, ...currentTasks.filter((task) => task.id !== operation.tempTaskId)]
          );
          continue;
        }

        if (operation.kind === 'complete') {
          const updated = await tasksApi.completeTask(token, operation.listId, operation.taskId);
          updateTaskInList(operation.listId, updated);
          continue;
        }

        if (operation.kind === 'reopen') {
          const updated = await tasksApi.reopenTask(token, operation.listId, operation.taskId);
          updateTaskInList(operation.listId, updated);
          continue;
        }

        await tasksApi.deleteTask(token, operation.listId, operation.taskId);
        writeListTasks(
          operation.listId,
          readListTasks(operation.listId).filter((task) => task.id !== operation.taskId)
        );
      } catch {
        remainingOperations.push(operation);
      }
    }

    store.pendingMutationQueue = remainingOperations;

    if (remainingOperations.length > 0) {
      store.errorMessage = 'Certaines taches restent en attente de synchronisation.';
    } else if (store.errorMessage.includes('synchronisation')) {
      store.errorMessage = '';
    }
  }

  async function loadTasks(listId: string): Promise<void> {
    resetError();

    if (!isOnline()) {
      store.errorMessage = 'Mode hors ligne: impossible de charger les taches.';
      return;
    }

    store.isLoading = true;

    try {
      const token = getRequiredToken();
      const tasks = await tasksApi.getListTasks(token, listId);
      writeListTasks(listId, tasks);
    } catch {
      store.errorMessage = 'Impossible de charger les taches de la liste.';
      writeListTasks(listId, []);
    } finally {
      store.isLoading = false;
    }
  }

  async function createTask(
    listId: string,
    payload: CreateTaskPayload
  ): Promise<boolean> {
    resetError();

    if (payload.shortDescription.trim().length === 0) {
      store.errorMessage = 'La description courte est obligatoire.';
      return false;
    }

    if (!isOnline()) {
      const pendingTask = enqueuePendingCreate(listId, payload);
      writeListTasks(listId, [pendingTask, ...readListTasks(listId)]);
      store.errorMessage = 'Mode hors ligne: tache en attente de synchronisation.';
      return true;
    }

    try {
      const token = getRequiredToken();
      const created = await tasksApi.createTask(token, listId, payload);
      writeListTasks(listId, [created, ...readListTasks(listId)]);
      return true;
    } catch (error) {
      if (isConflictError(error)) {
        try {
          const token = getRequiredToken();
          await refreshListFromServer(token, listId);
          const created = await tasksApi.createTask(token, listId, payload);
          writeListTasks(listId, [created, ...readListTasks(listId)]);
          return true;
        } catch {
          store.errorMessage = 'Conflit de synchronisation detecte. Les taches ont ete rechargees.';
          return false;
        }
      }

      store.errorMessage = 'Creation de tache impossible.';
      return false;
    }
  }

  function updateTaskInList(listId: string, task: TaskSummary): void {
    const current = readListTasks(listId);
    const index = current.findIndex((item) => item.id === task.id);

    if (index < 0) {
      writeListTasks(listId, [task, ...current]);
      return;
    }

    writeListTasks(
      listId,
      current.map((item) => (item.id === task.id ? task : item))
    );
  }

  function upsertTaskFromRealtime(task: TaskSummary): void {
    updateTaskInList(task.listId, task);
  }

  function deleteTaskFromRealtime(payload: TaskDeletedEvent): void {
    writeListTasks(
      payload.listId,
      readListTasks(payload.listId).filter((item) => item.id !== payload.taskId)
    );
  }

  async function completeTask(listId: string, taskId: string): Promise<void> {
    resetError();

    if (!isOnline()) {
      enqueuePendingStatusMutation('complete', listId, taskId);
      applyOptimisticStatusMutation('complete', listId, taskId);
      store.errorMessage = 'Mode hors ligne: completion de tache en attente de synchronisation.';
      return;
    }

    try {
      const token = getRequiredToken();
      const updated = await tasksApi.completeTask(token, listId, taskId);
      updateTaskInList(listId, updated);
    } catch (error) {
      if (isConflictError(error)) {
        try {
          const token = getRequiredToken();
          await refreshListFromServer(token, listId);
          const updated = await tasksApi.completeTask(token, listId, taskId);
          updateTaskInList(listId, updated);
          return;
        } catch {
          store.errorMessage = 'Conflit de synchronisation detecte. Les taches ont ete rechargees.';
          return;
        }
      }

      store.errorMessage = 'Impossible de completer cette tache.';
    }
  }

  async function reopenTask(listId: string, taskId: string): Promise<void> {
    resetError();

    if (!isOnline()) {
      enqueuePendingStatusMutation('reopen', listId, taskId);
      applyOptimisticStatusMutation('reopen', listId, taskId);
      store.errorMessage = 'Mode hors ligne: reouverture de tache en attente de synchronisation.';
      return;
    }

    try {
      const token = getRequiredToken();
      const updated = await tasksApi.reopenTask(token, listId, taskId);
      updateTaskInList(listId, updated);
    } catch (error) {
      if (isConflictError(error)) {
        try {
          const token = getRequiredToken();
          await refreshListFromServer(token, listId);
          const updated = await tasksApi.reopenTask(token, listId, taskId);
          updateTaskInList(listId, updated);
          return;
        } catch {
          store.errorMessage = 'Conflit de synchronisation detecte. Les taches ont ete rechargees.';
          return;
        }
      }

      store.errorMessage = 'Impossible de reouvrir cette tache.';
    }
  }

  async function deleteTask(listId: string, taskId: string): Promise<void> {
    resetError();

    if (!isOnline()) {
      enqueuePendingStatusMutation('delete', listId, taskId);
      applyOptimisticStatusMutation('delete', listId, taskId);
      store.errorMessage = 'Mode hors ligne: suppression de tache en attente de synchronisation.';
      return;
    }

    try {
      const token = getRequiredToken();
      await tasksApi.deleteTask(token, listId, taskId);
      writeListTasks(
        listId,
        readListTasks(listId).filter((item) => item.id !== taskId)
      );
    } catch (error) {
      if (isConflictError(error)) {
        try {
          const token = getRequiredToken();
          await refreshListFromServer(token, listId);
          await tasksApi.deleteTask(token, listId, taskId);
          writeListTasks(
            listId,
            readListTasks(listId).filter((item) => item.id !== taskId)
          );
          return;
        } catch {
          store.errorMessage = 'Conflit de synchronisation detecte. Les taches ont ete rechargees.';
          return;
        }
      }

      store.errorMessage = 'Suppression de tache impossible.';
    }
  }

  return {
    isLoading: computed(() => store.isLoading),
    errorMessage: computed(() => store.errorMessage),
    pendingSyncCount: computed(() => store.pendingMutationQueue.length),
    getTasksForList: (listId: string) => computed(() => readListTasks(listId)),
    loadTasks,
    flushPendingMutations,
    createTask,
    completeTask,
    reopenTask,
    deleteTask,
    upsertTaskFromRealtime,
    deleteTaskFromRealtime,
    resetError
  };
}
