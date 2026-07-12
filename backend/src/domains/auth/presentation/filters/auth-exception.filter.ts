import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { EmailAlreadyRegisteredApplicationException } from '../../application/exceptions/email-already-registered.application-exception';
import { InvalidCredentialsApplicationException } from '../../application/exceptions/invalid-credentials.application-exception';
import { InvalidRefreshTokenApplicationException } from '../../application/exceptions/invalid-refresh-token.application-exception';
import { InvalidEmailFormatDomainException } from '../../domain/exceptions/invalid-email-format.domain-exception';
import { WeakPasswordDomainException } from '../../domain/exceptions/weak-password.domain-exception';

@Catch(
  EmailAlreadyRegisteredApplicationException,
  InvalidCredentialsApplicationException,
  InvalidRefreshTokenApplicationException,
  InvalidEmailFormatDomainException,
  WeakPasswordDomainException,
)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof EmailAlreadyRegisteredApplicationException) {
      response.status(HttpStatus.CONFLICT).json({ message: exception.message });
      return;
    }

    if (exception instanceof InvalidCredentialsApplicationException) {
      response.status(HttpStatus.UNAUTHORIZED).json({ message: exception.message });
      return;
    }

    if (exception instanceof InvalidRefreshTokenApplicationException) {
      response.status(HttpStatus.UNAUTHORIZED).json({ message: exception.message });
      return;
    }

    if (
      exception instanceof InvalidEmailFormatDomainException ||
      exception instanceof WeakPasswordDomainException
    ) {
      response.status(HttpStatus.BAD_REQUEST).json({ message: exception.message });
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Unexpected error.' });
  }
}
