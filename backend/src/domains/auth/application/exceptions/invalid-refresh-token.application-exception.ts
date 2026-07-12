export class InvalidRefreshTokenApplicationException extends Error {
  constructor() {
    super('Invalid refresh token.');
    this.name = 'InvalidRefreshTokenApplicationException';
  }
}
