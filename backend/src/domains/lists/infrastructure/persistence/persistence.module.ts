import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ListsRepositoryPort } from '../../domain/ports/lists-repository.port';
import { InMemoryListsRepositoryAdapter } from './common/in-memory-lists-repository.adapter';
import { ListsStoreService } from './common/lists-store.service';
import { ListsPersistenceDriver } from './persistence-driver.type';
import { ListsPrismaService } from './prisma/prisma.service';
import { PrismaListsRepositoryAdapter } from './prisma/prisma-lists-repository.adapter';
import { ListsTypeOrmDataSourceService } from './typeorm/typeorm-data-source.service';
import { TypeOrmListsRepositoryAdapter } from './typeorm/typeorm-lists-repository.adapter';

export interface ListsPersistenceModuleOptions {
  readonly driver: ListsPersistenceDriver;
}

@Module({})
export class ListsPersistenceModule {
  static register(options: ListsPersistenceModuleOptions): DynamicModule {
    const providers = ListsPersistenceModule.resolveProviders(options.driver);

    return {
      module: ListsPersistenceModule,
      providers,
      exports: [ListsRepositoryPort],
    };
  }

  private static resolveProviders(driver: ListsPersistenceDriver): Provider[] {
    if (driver === 'typeorm') {
      return [
        ListsTypeOrmDataSourceService,
        TypeOrmListsRepositoryAdapter,
        {
          provide: ListsRepositoryPort,
          useClass: TypeOrmListsRepositoryAdapter,
        },
      ];
    }

    if (driver === 'prisma') {
      return [
        ListsPrismaService,
        PrismaListsRepositoryAdapter,
        {
          provide: ListsRepositoryPort,
          useClass: PrismaListsRepositoryAdapter,
        },
      ];
    }

    return [
      ListsStoreService,
      InMemoryListsRepositoryAdapter,
      {
        provide: ListsRepositoryPort,
        useClass: InMemoryListsRepositoryAdapter,
      },
    ];
  }
}
