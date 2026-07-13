import { describe, expect, it } from 'vitest';
import { isTaskCompleted, type TaskSummary } from '~/domains/tasks/domain/task-summary';

function createTask(overrides: Partial<TaskSummary> = {}): TaskSummary {
  return {
    id: 'task-1',
    ownerUserId: 'user-1',
    listId: 'list-1',
    shortDescription: 'Write tests',
    longDescription: null,
    dueDate: '2026-07-15T12:00:00.000Z',
    completedAt: null,
    createdAt: '2026-07-10T08:00:00.000Z',
    updatedAt: '2026-07-10T08:00:00.000Z',
    ...overrides
  };
}

describe('tasks domain helpers', () => {
  it('returns false when task is not completed', () => {
    const task = createTask({ completedAt: null });

    expect(isTaskCompleted(task)).toBe(false);
  });

  it('returns true when task has completedAt', () => {
    const task = createTask({ completedAt: '2026-07-11T09:00:00.000Z' });

    expect(isTaskCompleted(task)).toBe(true);
  });
});
