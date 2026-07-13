import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ListAccessDeniedApplicationException } from '../../application/exceptions/list-access-denied.application-exception';
import { ListNameAlreadyExistsApplicationException } from '../../application/exceptions/list-name-already-exists.application-exception';
import { ListNotFoundApplicationException } from '../../application/exceptions/list-not-found.application-exception';
import { InvalidListIdDomainException } from '../../domain/exceptions/invalid-list-id.domain-exception';
import { InvalidListNameDomainException } from '../../domain/exceptions/invalid-list-name.domain-exception';
import { InvalidOwnerUserIdDomainException } from '../../domain/exceptions/invalid-owner-user-id.domain-exception';

@Catch(
  ListNameAlreadyExistsApplicationException,
  ListNotFoundApplicationException,
  ListAccessDeniedApplicationException,
  InvalidListIdDomainException,
  InvalidListNameDomainException,
  InvalidOwnerUserIdDomainException,
)
export class ListsExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ListNameAlreadyExistsApplicationException) {
      response.status(HttpStatus.CONFLICT).json({ message: exception.message });
      return;
    }

    if (exception instanceof ListNotFoundApplicationException) {
      response.status(HttpStatus.NOT_FOUND).json({ message: exception.message });
      return;
    }

    if (exception instanceof ListAccessDeniedApplicationException) {
      response.status(HttpStatus.FORBIDDEN).json({ message: exception.message });
      return;
    }

    if (
      exception instanceof InvalidListIdDomainException ||
      exception instanceof InvalidListNameDomainException ||
      exception instanceof InvalidOwnerUserIdDomainException
    ) {
      response.status(HttpStatus.BAD_REQUEST).json({ message: exception.message });
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Unexpected error.' });
  }
}
