import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserAlreadyExistsApplicationException } from '../../application/exceptions/user-already-exists.application-exception';
import { UserNotFoundApplicationException } from '../../application/exceptions/user-not-found.application-exception';
import { InvalidUserEmailFormatDomainException } from '../../domain/exceptions/invalid-user-email-format.domain-exception';
import { InvalidUserIdDomainException } from '../../domain/exceptions/invalid-user-id.domain-exception';
import { InvalidUserNameDomainException } from '../../domain/exceptions/invalid-user-name.domain-exception';

@Catch(
  UserAlreadyExistsApplicationException,
  UserNotFoundApplicationException,
  InvalidUserEmailFormatDomainException,
  InvalidUserNameDomainException,
  InvalidUserIdDomainException,
  ForbiddenException,
)
export class UsersExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof UserAlreadyExistsApplicationException) {
      response.status(HttpStatus.CONFLICT).json({ message: exception.message });
      return;
    }

    if (exception instanceof UserNotFoundApplicationException) {
      response.status(HttpStatus.NOT_FOUND).json({ message: exception.message });
      return;
    }

    if (exception instanceof ForbiddenException) {
      response.status(HttpStatus.FORBIDDEN).json({ message: exception.message });
      return;
    }

    if (
      exception instanceof InvalidUserEmailFormatDomainException ||
      exception instanceof InvalidUserNameDomainException ||
      exception instanceof InvalidUserIdDomainException
    ) {
      response.status(HttpStatus.BAD_REQUEST).json({ message: exception.message });
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Unexpected error.' });
  }
}
