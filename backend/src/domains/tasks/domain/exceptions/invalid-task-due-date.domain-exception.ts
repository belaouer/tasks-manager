export class InvalidTaskDueDateDomainException extends Error {
  constructor() {
    super('Invalid task due date. A valid date is required.');
    this.name = 'InvalidTaskDueDateDomainException';
  }
}
