export class ListNotFoundApplicationException extends Error {
  constructor() {
    super('List not found.');
    this.name = 'ListNotFoundApplicationException';
  }
}
