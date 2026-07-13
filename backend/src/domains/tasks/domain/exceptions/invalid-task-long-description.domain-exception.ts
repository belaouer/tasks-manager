export class InvalidTaskLongDescriptionDomainException extends Error {
  constructor() {
    super(
      'Invalid task long description. It must contain at most 2000 characters.',
    );
    this.name = 'InvalidTaskLongDescriptionDomainException';
  }
}
