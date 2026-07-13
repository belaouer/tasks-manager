import { computed } from 'vue';
import { useAuthSession } from '~/domains/auth/application/use-auth-session';
import type { CreateTaskPayload, TaskSummary } from '../domain/task-summary';
import type { TaskDeletedEvent } from '../domain/tasks-realtime-events';
import { HttpTasksApiAdapter } from '../infrastructure/http-tasks-api.adapter';

const TASKS_STATE_KEY = 'tasks-manager.tasks.by-list';
const TASKS_LOADING_KEY = 'tasks-manager.tasks.loading';
const TASKS_ERROR_KEY = 'tasks-manager.tasks.error';

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

    if (!isOnline()) {
      errorMessage.value = 'Mode hors ligne: creation de tache indisponible.';
      return false;
    }

    if (payload.shortDescription.trim().length === 0) {
      errorMessage.value = 'La description courte est obligatoire.';
      return false;
    }

    try {
      const token = getRequiredToken();
      const created = await tasksApi.createTask(token, listId, payload);
      writeListTasks(listId, [created, ...readListTasks(listId)]);
      return true;
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      errorMessage.value = 'Suppression de tache impossible.';
    }
  }

  return {
    isLoading: computed(() => isLoading.value),
    errorMessage: computed(() => errorMessage.value),
    getTasksForList: (listId: string) => computed(() => readListTasks(listId)),
    loadTasks,
    createTask,
    completeTask,
    reopenTask,
    deleteTask,
    upsertTaskFromRealtime,
    deleteTaskFromRealtime,
    resetError
  };
}
