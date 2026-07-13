import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { TaskAccessDeniedApplicationException } from '../../application/exceptions/task-access-denied.application-exception';
import { TaskNotFoundApplicationException } from '../../application/exceptions/task-not-found.application-exception';
import { InvalidTaskDueDateDomainException } from '../../domain/exceptions/invalid-task-due-date.domain-exception';
import { InvalidTaskIdDomainException } from '../../domain/exceptions/invalid-task-id.domain-exception';
import { InvalidTaskListIdDomainException } from '../../domain/exceptions/invalid-task-list-id.domain-exception';
import { InvalidTaskLongDescriptionDomainException } from '../../domain/exceptions/invalid-task-long-description.domain-exception';
import { InvalidTaskOwnerUserIdDomainException } from '../../domain/exceptions/invalid-task-owner-user-id.domain-exception';
import { InvalidTaskShortDescriptionDomainException } from '../../domain/exceptions/invalid-task-short-description.domain-exception';

@Catch(
  TaskNotFoundApplicationException,
  TaskAccessDeniedApplicationException,
  InvalidTaskIdDomainException,
  InvalidTaskListIdDomainException,
  InvalidTaskOwnerUserIdDomainException,
  InvalidTaskShortDescriptionDomainException,
  InvalidTaskLongDescriptionDomainException,
  InvalidTaskDueDateDomainException,
)
export class TasksExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof TaskNotFoundApplicationException) {
      response.status(HttpStatus.NOT_FOUND).json({ message: exception.message });
      return;
    }

    if (exception instanceof TaskAccessDeniedApplicationException) {
      response.status(HttpStatus.FORBIDDEN).json({ message: exception.message });
      return;
    }

    if (
      exception instanceof InvalidTaskIdDomainException ||
      exception instanceof InvalidTaskListIdDomainException ||
      exception instanceof InvalidTaskOwnerUserIdDomainException ||
      exception instanceof InvalidTaskShortDescriptionDomainException ||
      exception instanceof InvalidTaskLongDescriptionDomainException ||
      exception instanceof InvalidTaskDueDateDomainException
    ) {
      response.status(HttpStatus.BAD_REQUEST).json({ message: exception.message });
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Unexpected error.' });
  }
}
