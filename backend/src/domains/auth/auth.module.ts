import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { ClockPort } from './domain/ports/clock.port';
import { IdGeneratorPort } from './domain/ports/id-generator.port';
import { PasswordHasherPort } from './domain/ports/password-hasher.port';
import { TokenIssuerPort } from './domain/ports/token-issuer.port';
import { TokenVerifierPort } from './domain/ports/token-verifier.port';
import { JwtTokenIssuerAdapter } from './infrastructure/jwt/jwt-token-issuer.adapter';
import { JwtTokenVerifierAdapter } from './infrastructure/jwt/jwt-token-verifier.adapter';
import { PersistenceModule } from './infrastructure/persistence/persistence.module';
import { resolvePersistenceDriver } from './infrastructure/persistence/persistence-driver.type';
import { BcryptPasswordHasherAdapter } from './infrastructure/security/bcrypt-password-hasher.adapter';
import { SystemClockAdapter } from './infrastructure/services/system-clock.adapter';
import { UuidIdGeneratorAdapter } from './infrastructure/services/uuid-id-generator.adapter';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    JwtModule.register({}),
    PersistenceModule.register({
      driver: resolvePersistenceDriver(process.env.PERSISTENCE_DRIVER),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    {
      provide: PasswordHasherPort,
      useClass: BcryptPasswordHasherAdapter,
    },
    {
      provide: TokenIssuerPort,
      useClass: JwtTokenIssuerAdapter,
    },
    {
      provide: TokenVerifierPort,
      useClass: JwtTokenVerifierAdapter,
    },
    {
      provide: ClockPort,
      useClass: SystemClockAdapter,
    },
    {
      provide: IdGeneratorPort,
      useClass: UuidIdGeneratorAdapter,
    },
  ],
  exports: [RegisterUseCase, LoginUseCase, RefreshTokenUseCase, LogoutUseCase],
})
export class AuthModule {}
