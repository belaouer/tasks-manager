export class InvalidUserEmailFormatDomainException extends Error {
  constructor() {
    super('Invalid user email format.');
    this.name = 'InvalidUserEmailFormatDomainException';
  }
}
