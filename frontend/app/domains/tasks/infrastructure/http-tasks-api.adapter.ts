import type { CreateTaskPayload, TaskSummary } from '../domain/task-summary';
import { TasksApiPort } from '../domain/tasks-api.port';

function createAuthorizedHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

export class HttpTasksApiAdapter extends TasksApiPort {
  private get api() {
    const { $api } = useNuxtApp();
    return $api;
  }

  async getListTasks(
    accessToken: string,
    listId: string
  ): Promise<readonly TaskSummary[]> {
    return this.api<readonly TaskSummary[]>(`/lists/${listId}/tasks`, {
      method: 'GET',
      headers: createAuthorizedHeaders(accessToken)
    });
  }

  async createTask(
    accessToken: string,
    listId: string,
    payload: CreateTaskPayload
  ): Promise<TaskSummary> {
    return this.api<TaskSummary>(`/lists/${listId}/tasks`, {
      method: 'POST',
      headers: createAuthorizedHeaders(accessToken),
      body: payload
    });
  }

  async completeTask(
    accessToken: string,
    listId: string,
    taskId: string
  ): Promise<TaskSummary> {
    return this.api<TaskSummary>(`/lists/${listId}/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: createAuthorizedHeaders(accessToken)
    });
  }

  async reopenTask(
    accessToken: string,
    listId: string,
    taskId: string
  ): Promise<TaskSummary> {
    return this.api<TaskSummary>(`/lists/${listId}/tasks/${taskId}/reopen`, {
      method: 'PATCH',
      headers: createAuthorizedHeaders(accessToken)
    });
  }

  async deleteTask(
    accessToken: string,
    listId: string,
    taskId: string
  ): Promise<void> {
    await this.api(`/lists/${listId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: createAuthorizedHeaders(accessToken)
    });
  }
}
