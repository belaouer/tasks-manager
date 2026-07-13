import type { CreateTaskPayload, TaskSummary } from '../domain/task-summary';
import { TasksApiPort } from '../domain/tasks-api.port';

function createAuthorizedHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

export class HttpTasksApiAdapter extends TasksApiPort {
  private get baseUrl(): string {
    const config = useRuntimeConfig();
    return config.public.apiBaseUrl;
  }

  async getListTasks(
    accessToken: string,
    listId: string
  ): Promise<readonly TaskSummary[]> {
    return $fetch<readonly TaskSummary[]>(`/lists/${listId}/tasks`, {
      baseURL: this.baseUrl,
      method: 'GET',
      headers: createAuthorizedHeaders(accessToken)
    });
  }

  async createTask(
    accessToken: string,
    listId: string,
    payload: CreateTaskPayload
  ): Promise<TaskSummary> {
    return $fetch<TaskSummary>(`/lists/${listId}/tasks`, {
      baseURL: this.baseUrl,
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
    return $fetch<TaskSummary>(`/lists/${listId}/tasks/${taskId}/complete`, {
      baseURL: this.baseUrl,
      method: 'PATCH',
      headers: createAuthorizedHeaders(accessToken)
    });
  }

  async reopenTask(
    accessToken: string,
    listId: string,
    taskId: string
  ): Promise<TaskSummary> {
    return $fetch<TaskSummary>(`/lists/${listId}/tasks/${taskId}/reopen`, {
      baseURL: this.baseUrl,
      method: 'PATCH',
      headers: createAuthorizedHeaders(accessToken)
    });
  }

  async deleteTask(
    accessToken: string,
    listId: string,
    taskId: string
  ): Promise<void> {
    await $fetch(`/lists/${listId}/tasks/${taskId}`, {
      baseURL: this.baseUrl,
      method: 'DELETE',
      headers: createAuthorizedHeaders(accessToken)
    });
  }
}
