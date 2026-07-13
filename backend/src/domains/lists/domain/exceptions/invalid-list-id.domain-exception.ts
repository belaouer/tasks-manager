export class InvalidListIdDomainException extends Error {
  constructor() {
    super('Invalid list id.');
    this.name = 'InvalidListIdDomainException';
  }
}
