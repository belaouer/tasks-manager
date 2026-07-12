export class EmailAlreadyRegisteredApplicationException extends Error {
  constructor() {
    super('An account already exists for this email.');
    this.name = 'EmailAlreadyRegisteredApplicationException';
  }
}
