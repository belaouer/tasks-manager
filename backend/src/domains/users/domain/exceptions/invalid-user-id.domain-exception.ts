export class InvalidUserIdDomainException extends Error {
  constructor() {
    super('Invalid user id.');
    this.name = 'InvalidUserIdDomainException';
  }
}
