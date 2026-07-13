export class InvalidUserNameDomainException extends Error {
  constructor(field: 'firstName' | 'lastName') {
    super(`Invalid ${field}. It must contain between 2 and 100 characters.`);
    this.name = 'InvalidUserNameDomainException';
  }
}
