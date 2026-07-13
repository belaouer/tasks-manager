export class InvalidListNameDomainException extends Error {
  constructor() {
    super('Invalid list name. It must contain between 1 and 120 characters.');
    this.name = 'InvalidListNameDomainException';
  }
}
