import { Injectable } from '@nestjs/common';
import { UsersClockPort } from '../../domain/ports/users-clock.port';
import { UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { FirstName } from '../../domain/value-objects/first-name.value-object';
import { LastName } from '../../domain/value-objects/last-name.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { UpdateUserProfileCommand } from '../dto/update-user-profile.command';
import { UserProfileDto } from '../dto/user-profile.dto';
import { UserNotFoundApplicationException } from '../exceptions/user-not-found.application-exception';

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    private readonly usersRepository: UsersRepositoryPort,
    private readonly usersClock: UsersClockPort,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<UserProfileDto> {
    const userId = UserId.create(command.userId);
    const firstName = FirstName.create(command.firstName);
    const lastName = LastName.create(command.lastName);

    const existingUser = await this.usersRepository.findById(userId);
    if (existingUser === null) {
      throw new UserNotFoundApplicationException();
    }

    const updatedUser = existingUser.updateName(
      firstName,
      lastName,
      this.usersClock.now(),
    );

    await this.usersRepository.update(updatedUser);

    return new UserProfileDto(
      updatedUser.getId().getValue(),
      updatedUser.getEmail().getValue(),
      updatedUser.getFirstName().getValue(),
      updatedUser.getLastName().getValue(),
      updatedUser.getCreatedAt(),
      updatedUser.getUpdatedAt(),
    );
  }
}
