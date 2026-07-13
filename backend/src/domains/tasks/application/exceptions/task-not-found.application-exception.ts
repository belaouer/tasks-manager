export class TaskNotFoundApplicationException extends Error {
  constructor() {
    super('Task not found.');
    this.name = 'TaskNotFoundApplicationException';
  }
}
