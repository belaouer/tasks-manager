import { DynamicModule, Module, Provider } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { InMemoryUserRepositoryAdapter } from './common/in-memory-user-repository.adapter';
import { AuthUserStoreService } from './common/auth-user-store.service';
import { PersistenceDriver } from './persistence-driver.type';
import { PrismaService } from './prisma/prisma.service';
import { PrismaUserRepositoryAdapter } from './prisma/prisma-user-repository.adapter';
import { TypeOrmDataSourceService } from './typeorm/typeorm-data-source.service';
import { TypeOrmUserRepositoryAdapter } from './typeorm/typeorm-user-repository.adapter';

export interface PersistenceModuleOptions {
  readonly driver: PersistenceDriver;
}

@Module({})
export class PersistenceModule {
  static register(options: PersistenceModuleOptions): DynamicModule {
    const providers = PersistenceModule.resolveProviders(options.driver);

    return {
      module: PersistenceModule,
      providers,
      exports: [UserRepositoryPort],
    };
  }

  private static resolveProviders(
    driver: PersistenceDriver,
  ): Provider[] {
    if (driver === 'typeorm') {
      return [
        TypeOrmDataSourceService,
        TypeOrmUserRepositoryAdapter,
        {
          provide: UserRepositoryPort,
          useClass: TypeOrmUserRepositoryAdapter,
        },
      ];
    }

    if (driver === 'prisma') {
      return [
        PrismaService,
        PrismaUserRepositoryAdapter,
        {
          provide: UserRepositoryPort,
          useClass: PrismaUserRepositoryAdapter,
        },
      ];
    }

    return [
      AuthUserStoreService,
      InMemoryUserRepositoryAdapter,
      {
        provide: UserRepositoryPort,
        useClass: InMemoryUserRepositoryAdapter,
      },
    ];
  }
}
