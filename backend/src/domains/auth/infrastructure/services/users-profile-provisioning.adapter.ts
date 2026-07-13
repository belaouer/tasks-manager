import { Injectable } from '@nestjs/common';
import { CreateUserCommand } from '../../../users/application/dto/create-user.command';
import { UserAlreadyExistsApplicationException } from '../../../users/application/exceptions/user-already-exists.application-exception';
import { CreateUserUseCase } from '../../../users/application/use-cases/create-user.use-case';
import { InvalidUserEmailFormatDomainException } from '../../../users/domain/exceptions/invalid-user-email-format.domain-exception';
import { InvalidUserNameDomainException } from '../../../users/domain/exceptions/invalid-user-name.domain-exception';
import { EmailAlreadyRegisteredApplicationException } from '../../application/exceptions/email-already-registered.application-exception';
import { InvalidUserProfileApplicationException } from '../../application/exceptions/invalid-user-profile.application-exception';
import {
  ProvisionUserProfileCommand,
  UserProfileProvisioningPort,
} from '../../domain/ports/user-profile-provisioning.port';

@Injectable()
export class UsersProfileProvisioningAdapter extends UserProfileProvisioningPort {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {
    super();
  }

  async provision(command: ProvisionUserProfileCommand): Promise<void> {
    try {
      await this.createUserUseCase.execute(
        new CreateUserCommand(
          command.email,
          command.firstName,
          command.lastName,
          command.userId,
        ),
      );
    } catch (error) {
      if (error instanceof UserAlreadyExistsApplicationException) {
        throw new EmailAlreadyRegisteredApplicationException();
      }

      if (
        error instanceof InvalidUserEmailFormatDomainException ||
        error instanceof InvalidUserNameDomainException
      ) {
        throw new InvalidUserProfileApplicationException();
      }

      throw error;
    }
  }
}
