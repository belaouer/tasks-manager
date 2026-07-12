export class WeakPasswordDomainException extends Error {
  constructor() {
    super('Password does not meet security requirements.');
    this.name = 'WeakPasswordDomainException';
  }
}
