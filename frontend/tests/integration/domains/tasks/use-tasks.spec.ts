import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTasks } from '~/domains/tasks/application/use-tasks';
import { useTasksRealtime } from '~/domains/tasks/application/use-tasks-realtime';
import type {
  CreateTaskPayload,
  TaskSummary
} from '~/domains/tasks/domain/task-summary';

function createTask(overrides: Partial<TaskSummary> = {}): TaskSummary {
  return {
    id: 'task-1',
    ownerUserId: 'user-1',
    listId: 'list-1',
    shortDescription: 'Prepare sprint',
    longDescription: null,
    dueDate: '2026-07-20T12:00:00.000Z',
    completedAt: null,
    createdAt: '2026-07-10T12:00:00.000Z',
    updatedAt: '2026-07-10T12:00:00.000Z',
    ...overrides
  };
}

describe('useTasks integration', () => {
  beforeEach(() => {
    (globalThis as any).__resetNuxtStateStore?.();
  });

  it('loads, creates, completes, reopens and deletes tasks for a list', async () => {
    const taskStore: TaskSummary[] = [createTask()];

    const api = {
      getListTasks: vi.fn(async () => taskStore),
      createTask: vi.fn(async (_token: string, listId: string, payload: CreateTaskPayload) => {
        const created = createTask({
          id: 'task-2',
          listId,
          shortDescription: payload.shortDescription,
          longDescription: payload.longDescription,
          dueDate: payload.dueDate
        });
        taskStore.unshift(created);
        return created;
      }),
      completeTask: vi.fn(async (_token: string, _listId: string, taskId: string) => {
        const current = taskStore.find((item) => item.id === taskId)!;
        const updated = {
          ...current,
          completedAt: '2026-07-12T09:00:00.000Z'
        } satisfies TaskSummary;
        taskStore.splice(taskStore.indexOf(current), 1, updated);
        return updated;
      }),
      reopenTask: vi.fn(async (_token: string, _listId: string, taskId: string) => {
        const current = taskStore.find((item) => item.id === taskId)!;
        const updated = {
          ...current,
          completedAt: null
        } satisfies TaskSummary;
        taskStore.splice(taskStore.indexOf(current), 1, updated);
        return updated;
      }),
      deleteTask: vi.fn(async (_token: string, _listId: string, taskId: string) => {
        const index = taskStore.findIndex((item) => item.id === taskId);
        if (index >= 0) {
          taskStore.splice(index, 1);
        }
      })
    };

    const tasks = useTasks({
      getAccessToken: () => 'access-token',
      tasksApi: api
    });

    await tasks.loadTasks('list-1');
    expect(tasks.getTasksForList('list-1').value).toHaveLength(1);

    const created = await tasks.createTask('list-1', {
      shortDescription: 'Draft release notes',
      longDescription: null,
      dueDate: '2026-07-25T12:00:00.000Z'
    });

    expect(created).toBe(true);
    expect(tasks.getTasksForList('list-1').value[0]?.shortDescription).toBe('Draft release notes');

    const createdTaskId = tasks.getTasksForList('list-1').value[0]!.id;
    await tasks.completeTask('list-1', createdTaskId);
    expect(tasks.getTasksForList('list-1').value[0]?.completedAt).not.toBeNull();

    await tasks.reopenTask('list-1', createdTaskId);
    expect(tasks.getTasksForList('list-1').value[0]?.completedAt).toBeNull();

    await tasks.deleteTask('list-1', createdTaskId);
    expect(tasks.getTasksForList('list-1').value.find((item) => item.id === createdTaskId)).toBeUndefined();
  });

  it('applies realtime upsert and delete events into list state', async () => {
    const api = {
      getListTasks: vi.fn(async () => []),
      createTask: vi.fn(),
      completeTask: vi.fn(),
      reopenTask: vi.fn(),
      deleteTask: vi.fn()
    };

    const tasks = useTasks({
      getAccessToken: () => 'access-token',
      tasksApi: api as any
    });

    await tasks.loadTasks('list-1');

    tasks.upsertTaskFromRealtime(
      createTask({ id: 'rt-1', listId: 'list-1', shortDescription: 'Realtime task' })
    );
    expect(tasks.getTasksForList('list-1').value).toHaveLength(1);

    tasks.deleteTaskFromRealtime({
      taskId: 'rt-1',
      listId: 'list-1',
      ownerUserId: 'user-1'
    });
    expect(tasks.getTasksForList('list-1').value).toHaveLength(0);
  });

  it('blocks tasks operations while offline', async () => {
    const api = {
      getListTasks: vi.fn(async () => []),
      createTask: vi.fn(),
      completeTask: vi.fn(),
      reopenTask: vi.fn(),
      deleteTask: vi.fn()
    };

    const tasks = useTasks({
      getAccessToken: () => 'access-token',
      isOnline: () => false,
      tasksApi: api as any
    });

    await tasks.loadTasks('list-1');
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: impossible de charger les taches.');
    expect(api.getListTasks).not.toHaveBeenCalled();

    const created = await tasks.createTask('list-1', {
      shortDescription: 'Offline task',
      longDescription: null,
      dueDate: '2026-07-26T12:00:00.000Z'
    });
    expect(created).toBe(false);
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: creation de tache indisponible.');
    expect(api.createTask).not.toHaveBeenCalled();

    await tasks.completeTask('list-1', 'task-1');
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: completion de tache indisponible.');
    expect(api.completeTask).not.toHaveBeenCalled();

    await tasks.reopenTask('list-1', 'task-1');
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: reouverture de tache indisponible.');
    expect(api.reopenTask).not.toHaveBeenCalled();

    await tasks.deleteTask('list-1', 'task-1');
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: suppression de tache indisponible.');
    expect(api.deleteTask).not.toHaveBeenCalled();
  });

  it('retries completeTask once after synchronization conflict', async () => {
    const initial = createTask({ id: 'task-1', completedAt: null });
    const completed = createTask({ id: 'task-1', completedAt: '2026-07-13T09:30:00.000Z' });

    const api = {
      getListTasks: vi.fn(async () => [initial]),
      createTask: vi.fn(),
      completeTask: vi
        .fn()
        .mockRejectedValueOnce({ status: 409 })
        .mockResolvedValueOnce(completed),
      reopenTask: vi.fn(),
      deleteTask: vi.fn()
    };

    const tasks = useTasks({
      getAccessToken: () => 'access-token',
      isOnline: () => true,
      tasksApi: api as any
    });

    await tasks.loadTasks('list-1');
    await tasks.completeTask('list-1', 'task-1');

    expect(api.completeTask).toHaveBeenCalledTimes(2);
    expect(api.getListTasks).toHaveBeenCalledTimes(2);
    expect(tasks.getTasksForList('list-1').value[0]?.completedAt).toBe('2026-07-13T09:30:00.000Z');
    expect(tasks.errorMessage.value).toBe('');
  });

  it('subscribes realtime and routes incoming events to handlers', () => {
    const onTaskUpsert = vi.fn();
    const onTaskDeleted = vi.fn();

    let registeredHandlers:
      | {
          onTaskCreated: (task: TaskSummary) => void;
          onTaskUpdated: (task: TaskSummary) => void;
          onTaskCompleted: (task: TaskSummary) => void;
          onTaskDeleted: (payload: {
            taskId: string;
            listId: string;
            ownerUserId: string;
          }) => void;
        }
      | null = null;
    let lifecycleHandlers:
      | {
          onConnecting: () => void;
          onConnected: () => void;
          onReconnecting: () => void;
          onDisconnected: () => void;
          onError: () => void;
        }
      | null = null;

    const realtimeAdapter = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      joinList: vi.fn(),
      leaveList: vi.fn(),
      onEvents: vi.fn((handlers) => {
        registeredHandlers = handlers;
      }),
      onLifecycle: vi.fn((handlers) => {
        lifecycleHandlers = handlers;
      }),
      removeAllListeners: vi.fn()
    };

    const realtime = useTasksRealtime({
      getAccessToken: () => 'access-token',
      realtimeAdapter,
      onTaskUpsert,
      onTaskDeleted
    });

    realtime.subscribeToList('list-1');

    expect(realtimeAdapter.connect).toHaveBeenCalledWith('access-token');
    expect(realtimeAdapter.joinList).toHaveBeenCalledWith('list-1');
    expect(registeredHandlers).not.toBeNull();
    expect(lifecycleHandlers).not.toBeNull();

    lifecycleHandlers!.onConnected();
    expect(realtimeAdapter.joinList).toHaveBeenCalledWith('list-1');
    expect(realtime.observability.value.lastConnectedAt).not.toBeNull();

    lifecycleHandlers!.onReconnecting();
    lifecycleHandlers!.onReconnecting();
    expect(realtime.observability.value.reconnectAttempts).toBe(2);

    lifecycleHandlers!.onDisconnected();
    expect(realtime.observability.value.lastDisconnectedAt).not.toBeNull();

    lifecycleHandlers!.onError();
    expect(realtime.observability.value.lastErrorAt).not.toBeNull();

    registeredHandlers!.onTaskCreated(createTask({ id: 'created' }));
    registeredHandlers!.onTaskUpdated(createTask({ id: 'updated' }));
    registeredHandlers!.onTaskCompleted(createTask({ id: 'completed' }));
    registeredHandlers!.onTaskDeleted({
      taskId: 'deleted',
      listId: 'list-1',
      ownerUserId: 'user-1'
    });

    expect(onTaskUpsert).toHaveBeenCalledTimes(3);
    expect(onTaskDeleted).toHaveBeenCalledTimes(1);

    realtime.stop();
    expect(realtimeAdapter.disconnect).toHaveBeenCalledTimes(1);
  });
});
