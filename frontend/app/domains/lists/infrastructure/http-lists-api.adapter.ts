import type { CreateListPayload, ListSummary } from '../domain/list-summary';
import { ListsApiPort } from '../domain/lists-api.port';

function createAuthorizedHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

export class HttpListsApiAdapter extends ListsApiPort {
  private get baseUrl(): string {
    const config = useRuntimeConfig();
    return config.public.apiBaseUrl;
  }

  async getLists(accessToken: string): Promise<readonly ListSummary[]> {
    return $fetch<readonly ListSummary[]>('/lists', {
      baseURL: this.baseUrl,
      method: 'GET',
      headers: createAuthorizedHeaders(accessToken)
    });
  }

  async createList(
    accessToken: string,
    payload: CreateListPayload
  ): Promise<ListSummary> {
    return $fetch<ListSummary>('/lists', {
      baseURL: this.baseUrl,
      method: 'POST',
      headers: createAuthorizedHeaders(accessToken),
      body: payload
    });
  }

  async deleteList(accessToken: string, listId: string): Promise<void> {
    await $fetch(`/lists/${listId}`, {
      baseURL: this.baseUrl,
      method: 'DELETE',
      headers: createAuthorizedHeaders(accessToken)
    });
  }
}
