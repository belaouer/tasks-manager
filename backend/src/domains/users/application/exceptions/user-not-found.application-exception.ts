export class UserNotFoundApplicationException extends Error {
  constructor() {
    super('User not found.');
    this.name = 'UserNotFoundApplicationException';
  }
}
