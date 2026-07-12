import { Injectable } from '@nestjs/common';
import { UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { GetUserProfileCommand } from '../dto/get-user-profile.command';
import { UserProfileDto } from '../dto/user-profile.dto';
import { UserNotFoundApplicationException } from '../exceptions/user-not-found.application-exception';

@Injectable()
export class GetUserProfileUseCase {
  constructor(private readonly usersRepository: UsersRepositoryPort) {}

  async execute(command: GetUserProfileCommand): Promise<UserProfileDto> {
    const userId = UserId.create(command.userId);
    const user = await this.usersRepository.findById(userId);

    if (user === null) {
      throw new UserNotFoundApplicationException();
    }

    return new UserProfileDto(
      user.getId().getValue(),
      user.getEmail().getValue(),
      user.getFirstName().getValue(),
      user.getLastName().getValue(),
      user.getCreatedAt(),
      user.getUpdatedAt(),
    );
  }
}
