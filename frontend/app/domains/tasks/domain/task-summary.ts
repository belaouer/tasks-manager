export interface TaskSummary {
  readonly id: string;
  readonly ownerUserId: string;
  readonly listId: string;
  readonly shortDescription: string;
  readonly longDescription: string | null;
  readonly dueDate: string;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly pendingSync?: boolean;
}

export interface CreateTaskPayload {
  readonly shortDescription: string;
  readonly longDescription: string | null;
  readonly dueDate: string;
}

export function isTaskCompleted(task: TaskSummary): boolean {
  return task.completedAt !== null;
}
