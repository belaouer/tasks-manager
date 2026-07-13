import type { CreateListPayload, ListSummary } from './list-summary';

export abstract class ListsApiPort {
  abstract getLists(accessToken: string): Promise<readonly ListSummary[]>;

  abstract createList(
    accessToken: string,
    payload: CreateListPayload
  ): Promise<ListSummary>;

  abstract deleteList(accessToken: string, listId: string): Promise<void>;
}
