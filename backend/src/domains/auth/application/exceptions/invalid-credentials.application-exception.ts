export class InvalidCredentialsApplicationException extends Error {
  constructor() {
    super('Invalid credentials.');
    this.name = 'InvalidCredentialsApplicationException';
  }
}
