import { Injectable } from '@nestjs/common';
import { ClockPort } from '../../domain/ports/clock.port';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { TokenIssuerPort } from '../../domain/ports/token-issuer.port';
import { TokenVerifierPort } from '../../domain/ports/token-verifier.port';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { AuthResultDto } from '../dto/auth-result.dto';
import { RefreshTokenCommand } from '../dto/refresh-token.command';
import { InvalidRefreshTokenApplicationException } from '../exceptions/invalid-refresh-token.application-exception';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly tokenVerifier: TokenVerifierPort,
    private readonly tokenIssuer: TokenIssuerPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<AuthResultDto> {
    const payload = await this.tokenVerifier.verifyRefreshToken(command.refreshToken);
    if (payload === null) {
      throw new InvalidRefreshTokenApplicationException();
    }

    const user = await this.userRepository.findById(UserId.create(payload.sub));
    const refreshTokenHash = user?.getRefreshTokenHash() ?? null;
    if (user === null || refreshTokenHash === null) {
      throw new InvalidRefreshTokenApplicationException();
    }

    const isRefreshTokenValid = await this.passwordHasher.compare(
      command.refreshToken,
      refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new InvalidRefreshTokenApplicationException();
    }

    const newTokens = await this.tokenIssuer.issueTokens({
      sub: user.getId().getValue(),
      email: user.getEmail().getValue(),
    });

    const rotatedRefreshTokenHash = await this.passwordHasher.hash(
      newTokens.refreshToken,
    );
    const userWithRotatedRefreshToken = user.withRefreshTokenHash(
      rotatedRefreshTokenHash,
      this.clock.now(),
    );
    await this.userRepository.update(userWithRotatedRefreshToken);

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }
}
