import type { CreateTaskPayload, TaskSummary } from './task-summary';

export abstract class TasksApiPort {
  abstract getListTasks(
    accessToken: string,
    listId: string
  ): Promise<readonly TaskSummary[]>;

  abstract createTask(
    accessToken: string,
    listId: string,
    payload: CreateTaskPayload
  ): Promise<TaskSummary>;

  abstract completeTask(
    accessToken: string,
    listId: string,
    taskId: string
  ): Promise<TaskSummary>;

  abstract reopenTask(
    accessToken: string,
    listId: string,
    taskId: string
  ): Promise<TaskSummary>;

  abstract deleteTask(
    accessToken: string,
    listId: string,
    taskId: string
  ): Promise<void>;
}
