export class UserAlreadyExistsApplicationException extends Error {
  constructor() {
    super('User already exists.');
    this.name = 'UserAlreadyExistsApplicationException';
  }
}
