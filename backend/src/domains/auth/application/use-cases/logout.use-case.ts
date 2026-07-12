import { Injectable } from '@nestjs/common';
import { ClockPort } from '../../domain/ports/clock.port';
import { TokenVerifierPort } from '../../domain/ports/token-verifier.port';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { LogoutCommand } from '../dto/logout.command';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly tokenVerifier: TokenVerifierPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const payload = await this.tokenVerifier.verifyRefreshToken(command.refreshToken);
    if (payload === null) {
      return;
    }

    const user = await this.userRepository.findById(UserId.create(payload.sub));
    if (user === null) {
      return;
    }

    await this.userRepository.update(user.clearRefreshToken(this.clock.now()));
  }
}
