import type { CreateListPayload, ListSummary } from '../domain/list-summary';
import { ListsApiPort } from '../domain/lists-api.port';

function createAuthorizedHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

export class HttpListsApiAdapter extends ListsApiPort {
  private get api() {
    const { $api } = useNuxtApp();
    return $api;
  }

  async getLists(accessToken: string): Promise<readonly ListSummary[]> {
    return this.api<readonly ListSummary[]>('/lists', {
      method: 'GET',
      headers: createAuthorizedHeaders(accessToken)
    });
  }

  async createList(
    accessToken: string,
    payload: CreateListPayload
  ): Promise<ListSummary> {
    return this.api<ListSummary>('/lists', {
      method: 'POST',
      headers: createAuthorizedHeaders(accessToken),
      body: payload
    });
  }

  async deleteList(accessToken: string, listId: string): Promise<void> {
    await this.api(`/lists/${listId}`, {
      method: 'DELETE',
      headers: createAuthorizedHeaders(accessToken)
    });
  }
}
