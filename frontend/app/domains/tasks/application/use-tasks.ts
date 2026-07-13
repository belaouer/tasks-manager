import { computed } from 'vue';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import type { CreateTaskPayload, TaskSummary } from '../domain/task-summary';
import type { TaskDeletedEvent } from '../domain/tasks-realtime-events';
import { HttpTasksApiAdapter } from '../infrastructure/http-tasks-api.adapter';

const TASKS_STATE_KEY = 'tasks-manager.tasks.by-list';
const TASKS_LOADING_KEY = 'tasks-manager.tasks.loading';
const TASKS_ERROR_KEY = 'tasks-manager.tasks.error';
const TASKS_PENDING_CREATE_QUEUE_KEY = 'tasks-manager.tasks.pending-create-queue';
const HTTP_CONFLICT_STATUS = 409;

interface PendingTaskCreateOperation {
  readonly operationId: string;
  readonly listId: string;
  readonly tempTaskId: string;
  readonly payload: CreateTaskPayload;
  readonly createdAt: string;
}

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
  const byList = useState<Record<string, readonly TaskSummary[]>>(TASKS_STATE_KEY, () => ({}));
  const isLoading = useState<boolean>(TASKS_LOADING_KEY, () => false);
  const errorMessage = useState<string>(TASKS_ERROR_KEY, () => '');
  const pendingCreateQueue = useState<readonly PendingTaskCreateOperation[]>(
    TASKS_PENDING_CREATE_QUEUE_KEY,
    () => []
  );

  const getAccessToken =
    deps.getAccessToken ??
    (() => {
      const authSession = useAuthSession();
      return authSession.accessToken.value;
    });
  const isOnline = deps.isOnline ?? (() => (!import.meta.client ? true : navigator.onLine));
  const tasksApi = deps.tasksApi ?? defaultApi;

  function resetError(): void {
    errorMessage.value = '';
  }

  function readListTasks(listId: string): readonly TaskSummary[] {
    return byList.value[listId] ?? [];
  }

  function writeListTasks(listId: string, tasks: readonly TaskSummary[]): void {
    byList.value = {
      ...byList.value,
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
      listId,
      tempTaskId,
      payload,
      createdAt: timestamp
    };

    pendingCreateQueue.value = [...pendingCreateQueue.value, operation];
    return createPendingTask(listId, payload, timestamp, tempTaskId);
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
    const pendingTasks = pendingCreateQueue.value
      .filter((operation) => operation.listId === listId)
      .map((operation) =>
        createPendingTask(listId, operation.payload, operation.createdAt, operation.tempTaskId)
      );

    writeListTasks(listId, [...pendingTasks, ...refreshed]);
  }

  async function flushPendingCreates(): Promise<void> {
    if (!isOnline() || pendingCreateQueue.value.length === 0) {
      return;
    }

    let token = '';
    try {
      token = getRequiredToken();
    } catch {
      errorMessage.value = 'Synchronisation en attente: session invalide.';
      return;
    }

    const remainingOperations: PendingTaskCreateOperation[] = [];

    for (const operation of pendingCreateQueue.value) {
      try {
        const created = await tasksApi.createTask(token, operation.listId, operation.payload);
        const currentTasks = readListTasks(operation.listId);
        writeListTasks(
          operation.listId,
          [created, ...currentTasks.filter((task) => task.id !== operation.tempTaskId)]
        );
      } catch {
        remainingOperations.push(operation);
      }
    }

    pendingCreateQueue.value = remainingOperations;

    if (remainingOperations.length > 0) {
      errorMessage.value = 'Certaines taches restent en attente de synchronisation.';
    } else if (errorMessage.value.includes('synchronisation')) {
      errorMessage.value = '';
    }
  }

  async function loadTasks(listId: string): Promise<void> {
    resetError();

    if (!isOnline()) {
      errorMessage.value = 'Mode hors ligne: impossible de charger les taches.';
      return;
    }

    isLoading.value = true;

    try {
      const token = getRequiredToken();
      const tasks = await tasksApi.getListTasks(token, listId);
      writeListTasks(listId, tasks);
    } catch {
      errorMessage.value = 'Impossible de charger les taches de la liste.';
      writeListTasks(listId, []);
    } finally {
      isLoading.value = false;
    }
  }

  async function createTask(
    listId: string,
    payload: CreateTaskPayload
  ): Promise<boolean> {
    resetError();

    if (payload.shortDescription.trim().length === 0) {
      errorMessage.value = 'La description courte est obligatoire.';
      return false;
    }

    if (!isOnline()) {
      const pendingTask = enqueuePendingCreate(listId, payload);
      writeListTasks(listId, [pendingTask, ...readListTasks(listId)]);
      errorMessage.value = 'Mode hors ligne: tache en attente de synchronisation.';
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
          errorMessage.value = 'Conflit de synchronisation detecte. Les taches ont ete rechargees.';
          return false;
        }
      }

      errorMessage.value = 'Creation de tache impossible.';
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
      errorMessage.value = 'Mode hors ligne: completion de tache indisponible.';
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
          errorMessage.value = 'Conflit de synchronisation detecte. Les taches ont ete rechargees.';
          return;
        }
      }

      errorMessage.value = 'Impossible de completer cette tache.';
    }
  }

  async function reopenTask(listId: string, taskId: string): Promise<void> {
    resetError();

    if (!isOnline()) {
      errorMessage.value = 'Mode hors ligne: reouverture de tache indisponible.';
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
          errorMessage.value = 'Conflit de synchronisation detecte. Les taches ont ete rechargees.';
          return;
        }
      }

      errorMessage.value = 'Impossible de reouvrir cette tache.';
    }
  }

  async function deleteTask(listId: string, taskId: string): Promise<void> {
    resetError();

    if (!isOnline()) {
      errorMessage.value = 'Mode hors ligne: suppression de tache indisponible.';
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
          errorMessage.value = 'Conflit de synchronisation detecte. Les taches ont ete rechargees.';
          return;
        }
      }

      errorMessage.value = 'Suppression de tache impossible.';
    }
  }

  return {
    isLoading: computed(() => isLoading.value),
    errorMessage: computed(() => errorMessage.value),
    pendingSyncCount: computed(() => pendingCreateQueue.value.length),
    getTasksForList: (listId: string) => computed(() => readListTasks(listId)),
    loadTasks,
    flushPendingCreates,
    createTask,
    completeTask,
    reopenTask,
    deleteTask,
    upsertTaskFromRealtime,
    deleteTaskFromRealtime,
    resetError
  };
}
