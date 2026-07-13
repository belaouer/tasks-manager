import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTasks } from '~/domains/tasks/application/use-tasks';
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
});
