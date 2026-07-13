export class TaskAccessDeniedApplicationException extends Error {
  constructor() {
    super('Task access denied.');
    this.name = 'TaskAccessDeniedApplicationException';
  }
}
