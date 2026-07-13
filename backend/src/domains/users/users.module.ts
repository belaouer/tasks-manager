import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from './application/use-cases/update-user-profile.use-case';
import { UsersClockPort } from './domain/ports/users-clock.port';
import { UsersIdGeneratorPort } from './domain/ports/users-id-generator.port';
import { UsersPersistenceModule } from './infrastructure/persistence/persistence.module';
import { resolveUsersPersistenceDriver } from './infrastructure/persistence/persistence-driver.type';
import { UsersSystemClockAdapter } from './infrastructure/services/system-clock.adapter';
import { UsersUuidIdGeneratorAdapter } from './infrastructure/services/uuid-id-generator.adapter';
import { UsersController } from './presentation/controllers/users.controller';
import { UsersJwtAuthGuard } from './presentation/guards/users-jwt-auth.guard';

@Module({
  imports: [
    UsersPersistenceModule.register({
      driver: resolveUsersPersistenceDriver(process.env.PERSISTENCE_DRIVER),
    }),
  ],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    GetUserProfileUseCase,
    UpdateUserProfileUseCase,
    JwtService,
    UsersJwtAuthGuard,
    {
      provide: UsersClockPort,
      useClass: UsersSystemClockAdapter,
    },
    {
      provide: UsersIdGeneratorPort,
      useClass: UsersUuidIdGeneratorAdapter,
    },
  ],
  exports: [CreateUserUseCase, GetUserProfileUseCase, UpdateUserProfileUseCase],
})
export class UsersModule {}
