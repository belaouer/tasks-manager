export class InvalidTaskListIdDomainException extends Error {
  constructor() {
    super('Invalid task list id. It must not be empty.');
    this.name = 'InvalidTaskListIdDomainException';
  }
}
