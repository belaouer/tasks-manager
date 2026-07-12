import { Injectable } from '@nestjs/common';
import { ClockPort } from '../../domain/ports/clock.port';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { TokenIssuerPort } from '../../domain/ports/token-issuer.port';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { Email } from '../../domain/value-objects/email.value-object';
import { AuthResultDto } from '../dto/auth-result.dto';
import { LoginCommand } from '../dto/login.command';
import { InvalidCredentialsApplicationException } from '../exceptions/invalid-credentials.application-exception';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenIssuer: TokenIssuerPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResultDto> {
    const email = Email.create(command.email);

    const user = await this.userRepository.findByEmail(email);
    if (user === null) {
      throw new InvalidCredentialsApplicationException();
    }

    const passwordMatches = await this.passwordHasher.compare(
      command.password,
      user.getPasswordHash(),
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsApplicationException();
    }

    const tokens = await this.tokenIssuer.issueTokens({
      sub: user.getId().getValue(),
      email: user.getEmail().getValue(),
    });

    const refreshTokenHash = await this.passwordHasher.hash(tokens.refreshToken);
    const now = this.clock.now();
    const userWithRefreshToken = user.withRefreshTokenHash(refreshTokenHash, now);
    await this.userRepository.update(userWithRefreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
