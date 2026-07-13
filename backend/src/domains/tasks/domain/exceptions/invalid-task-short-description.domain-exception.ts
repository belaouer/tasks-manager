export class InvalidTaskShortDescriptionDomainException extends Error {
  constructor() {
    super(
      'Invalid task short description. It must contain between 1 and 160 characters.',
    );
    this.name = 'InvalidTaskShortDescriptionDomainException';
  }
}
