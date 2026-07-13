export class InvalidTaskIdDomainException extends Error {
  constructor() {
    super('Invalid task id. It must not be empty.');
    this.name = 'InvalidTaskIdDomainException';
  }
}
