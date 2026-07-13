export class InvalidOwnerUserIdDomainException extends Error {
  constructor() {
    super('Invalid owner user id.');
    this.name = 'InvalidOwnerUserIdDomainException';
  }
}
