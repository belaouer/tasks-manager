export class ListAccessDeniedApplicationException extends Error {
  constructor() {
    super('You can only access your own lists.');
    this.name = 'ListAccessDeniedApplicationException';
  }
}
