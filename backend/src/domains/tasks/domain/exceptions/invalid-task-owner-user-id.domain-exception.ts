export class InvalidTaskOwnerUserIdDomainException extends Error {
  constructor() {
    super('Invalid task owner user id. It must not be empty.');
    this.name = 'InvalidTaskOwnerUserIdDomainException';
  }
}
