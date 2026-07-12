export class InvalidEmailFormatDomainException extends Error {
  constructor() {
    super('Invalid email format.');
    this.name = 'InvalidEmailFormatDomainException';
  }
}
