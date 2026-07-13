export class ListNameAlreadyExistsApplicationException extends Error {
  constructor() {
    super('List name already exists for this user.');
    this.name = 'ListNameAlreadyExistsApplicationException';
  }
}
