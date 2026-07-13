import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { ClockPort } from '../../domain/ports/clock.port';
import { IdGeneratorPort } from '../../domain/ports/id-generator.port';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { TokenIssuerPort } from '../../domain/ports/token-issuer.port';
import { UserProfileProvisioningPort } from '../../domain/ports/user-profile-provisioning.port';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { AuthResultDto } from '../dto/auth-result.dto';
import { RegisterCommand } from '../dto/register.command';
import { EmailAlreadyRegisteredApplicationException } from '../exceptions/email-already-registered.application-exception';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenIssuer: TokenIssuerPort,
    private readonly userProfileProvisioning: UserProfileProvisioningPort,
    private readonly clock: ClockPort,
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResultDto> {
    const email = Email.create(command.email);
    const password = Password.create(command.password);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser !== null) {
      throw new EmailAlreadyRegisteredApplicationException();
    }

    const passwordHash = await this.passwordHasher.hash(password.getValue());
    const now = this.clock.now();

    const userId = UserId.create(this.idGenerator.generate());

    await this.userProfileProvisioning.provision({
      userId: userId.getValue(),
      email: email.getValue(),
      firstName: command.firstName,
      lastName: command.lastName,
    });

    const user = AuthUser.registerNew({
      id: userId,
      email,
      passwordHash,
      now,
    });

    await this.userRepository.save(user);

    const tokens = await this.tokenIssuer.issueTokens({
      sub: user.getId().getValue(),
      email: user.getEmail().getValue(),
    });

    const refreshTokenHash = await this.passwordHasher.hash(tokens.refreshToken);
    const userWithRefreshToken = user.withRefreshTokenHash(refreshTokenHash, now);
    await this.userRepository.update(userWithRefreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
