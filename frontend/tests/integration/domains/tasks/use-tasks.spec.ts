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

  it('queues task mutations while offline and applies them optimistically', async () => {
    const api = {
      getListTasks: vi.fn(async () => []),
      createTask: vi.fn(),
      completeTask: vi.fn(),
      reopenTask: vi.fn(),
      deleteTask: vi.fn()
    };

    const initialTask = createTask({ id: 'task-1' });

    const tasks = useTasks({
      getAccessToken: () => 'access-token',
      tasksApi: api as any,
      isOnline: () => false,
    });

    await tasks.loadTasks('list-1');
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: impossible de charger les taches.');
    expect(api.getListTasks).not.toHaveBeenCalled();

    tasks.upsertTaskFromRealtime(initialTask);

    const created = await tasks.createTask('list-1', {
      shortDescription: 'Offline task',
      longDescription: null,
      dueDate: '2026-07-26T12:00:00.000Z'
    });
    expect(created).toBe(true);
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: tache en attente de synchronisation.');
    expect(api.createTask).not.toHaveBeenCalled();
    expect(tasks.pendingSyncCount.value).toBe(1);
    expect(tasks.getTasksForList('list-1').value[0]?.pendingSync).toBe(true);

    await tasks.completeTask('list-1', 'task-1');
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: completion de tache en attente de synchronisation.');
    expect(api.completeTask).not.toHaveBeenCalled();
    expect(tasks.getTasksForList('list-1').value.find((item) => item.id === 'task-1')?.completedAt).not.toBeNull();

    await tasks.reopenTask('list-1', 'task-1');
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: reouverture de tache en attente de synchronisation.');
    expect(api.reopenTask).not.toHaveBeenCalled();
    expect(tasks.getTasksForList('list-1').value.find((item) => item.id === 'task-1')?.completedAt).toBeNull();

    await tasks.deleteTask('list-1', 'task-1');
    expect(tasks.errorMessage.value).toBe('Mode hors ligne: suppression de tache en attente de synchronisation.');
    expect(api.deleteTask).not.toHaveBeenCalled();
    expect(tasks.getTasksForList('list-1').value.find((item) => item.id === 'task-1')).toBeUndefined();
  });

  it('flushes offline queued task mutations when connection is back', async () => {
    const createdServerTask = createTask({ id: 'server-task-1', pendingSync: undefined });
    const completedServerTask = createTask({ id: 'server-task-2' });

    let online = false;

    const api = {
      getListTasks: vi.fn(async () => [completedServerTask]),
      createTask: vi.fn(async () => createdServerTask),
      completeTask: vi.fn(async () => ({ ...completedServerTask, completedAt: '2026-07-13T10:00:00.000Z' })),
      reopenTask: vi.fn(async () => ({ ...completedServerTask, completedAt: null })),
      deleteTask: vi.fn(async () => undefined)
    };

    const tasks = useTasks({
      getAccessToken: () => 'access-token',
      isOnline: () => online,
      tasksApi: api as any
    });

    const queued = await tasks.createTask('list-1', {
      shortDescription: 'Queued task',
      longDescription: null,
      dueDate: '2026-07-26T12:00:00.000Z'
    });

    expect(queued).toBe(true);
    expect(tasks.pendingSyncCount.value).toBe(1);

    tasks.upsertTaskFromRealtime(completedServerTask);
    await tasks.completeTask('list-1', 'task-1');
    await tasks.reopenTask('list-1', 'task-1');
    await tasks.deleteTask('list-1', 'task-1');
    expect(tasks.pendingSyncCount.value).toBe(4);

    online = true;
    await tasks.flushPendingMutations();

    expect(tasks.pendingSyncCount.value).toBe(0);
    expect(api.createTask).toHaveBeenCalledTimes(1);
    expect(api.completeTask).toHaveBeenCalledTimes(1);
    expect(api.reopenTask).toHaveBeenCalledTimes(1);
    expect(api.deleteTask).toHaveBeenCalledTimes(1);
    expect(tasks.getTasksForList('list-1').value[0]?.id).toBe('server-task-1');
    expect(tasks.getTasksForList('list-1').value.find((item) => item.id === 'task-1')).toBeUndefined();
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

  it('backs off and retries queued task mutations after a transient failure', async () => {
    vi.useFakeTimers();

    try {
      let online = false;
      let createAttempts = 0;

      const createdServerTask = createTask({
        id: 'server-task-1',
        pendingSync: undefined
      });

      const api = {
        getListTasks: vi.fn(async () => []),
        createTask: vi.fn(async () => {
          createAttempts += 1;
          if (createAttempts === 1) {
            throw new Error('transient-failure');
          }

          return createdServerTask;
        }),
        completeTask: vi.fn(),
        reopenTask: vi.fn(),
        deleteTask: vi.fn()
      };

      const tasks = useTasks({
        getAccessToken: () => 'access-token',
        isOnline: () => online,
        tasksApi: api as any
      });

      const queued = await tasks.createTask('list-1', {
        shortDescription: 'Queued task',
        longDescription: null,
        dueDate: '2026-07-26T12:00:00.000Z'
      });

      expect(queued).toBe(true);

      online = true;
      await tasks.flushPendingMutations();

      expect(api.createTask).toHaveBeenCalledTimes(1);
      expect(tasks.pendingSyncCount.value).toBe(1);
      expect(tasks.errorMessage.value).toBe('Synchronisation des taches en attente: nouvelle tentative dans 2 secondes.');

      await vi.advanceTimersByTimeAsync(2000);

      expect(api.createTask).toHaveBeenCalledTimes(2);
      expect(tasks.pendingSyncCount.value).toBe(0);
      expect(tasks.errorMessage.value).toBe('');
      expect(tasks.getTasksForList('list-1').value[0]?.id).toBe('server-task-1');
    } finally {
      vi.useRealTimers();
    }
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
