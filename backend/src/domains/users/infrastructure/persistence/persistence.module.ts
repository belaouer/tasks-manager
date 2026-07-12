import { DynamicModule, Module, Provider } from '@nestjs/common';
import { UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { InMemoryUsersRepositoryAdapter } from './common/in-memory-users-repository.adapter';
import { UsersStoreService } from './common/users-store.service';
import { UsersPersistenceDriver } from './persistence-driver.type';
import { UsersPrismaService } from './prisma/prisma.service';
import { PrismaUsersRepositoryAdapter } from './prisma/prisma-users-repository.adapter';
import { UsersTypeOrmDataSourceService } from './typeorm/typeorm-data-source.service';
import { TypeOrmUsersRepositoryAdapter } from './typeorm/typeorm-users-repository.adapter';

export interface UsersPersistenceModuleOptions {
  readonly driver: UsersPersistenceDriver;
}

@Module({})
export class UsersPersistenceModule {
  static register(options: UsersPersistenceModuleOptions): DynamicModule {
    const providers = UsersPersistenceModule.resolveProviders(options.driver);

    return {
      module: UsersPersistenceModule,
      providers,
      exports: [UsersRepositoryPort],
    };
  }

  private static resolveProviders(driver: UsersPersistenceDriver): Provider[] {
    if (driver === 'typeorm') {
      return [
        UsersTypeOrmDataSourceService,
        TypeOrmUsersRepositoryAdapter,
        {
          provide: UsersRepositoryPort,
          useClass: TypeOrmUsersRepositoryAdapter,
        },
      ];
    }

    if (driver === 'prisma') {
      return [
        UsersPrismaService,
        PrismaUsersRepositoryAdapter,
        {
          provide: UsersRepositoryPort,
          useClass: PrismaUsersRepositoryAdapter,
        },
      ];
    }

    return [
      UsersStoreService,
      InMemoryUsersRepositoryAdapter,
      {
        provide: UsersRepositoryPort,
        useClass: InMemoryUsersRepositoryAdapter,
      },
    ];
  }
}
