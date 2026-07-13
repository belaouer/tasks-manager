export class InvalidUserProfileApplicationException extends Error {
  constructor() {
    super('Invalid user profile data.');
    this.name = 'InvalidUserProfileApplicationException';
  }
}
