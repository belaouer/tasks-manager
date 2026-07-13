import { DynamicModule, Module, Provider } from '@nestjs/common';
import { TasksRepositoryPort } from '../../domain/ports/tasks-repository.port';
import { InMemoryTasksRepositoryAdapter } from './common/in-memory-tasks-repository.adapter';
import { TasksStoreService } from './common/tasks-store.service';
import { TasksPersistenceDriver } from './persistence-driver.type';
import { TasksPrismaService } from './prisma/prisma.service';
import { PrismaTasksRepositoryAdapter } from './prisma/prisma-tasks-repository.adapter';
import { TasksTypeOrmDataSourceService } from './typeorm/typeorm-data-source.service';
import { TypeOrmTasksRepositoryAdapter } from './typeorm/typeorm-tasks-repository.adapter';

export interface TasksPersistenceModuleOptions {
  readonly driver: TasksPersistenceDriver;
}

@Module({})
export class TasksPersistenceModule {
  static register(options: TasksPersistenceModuleOptions): DynamicModule {
    const providers = TasksPersistenceModule.resolveProviders(options.driver);

    return {
      module: TasksPersistenceModule,
      providers,
      exports: [TasksRepositoryPort],
    };
  }

  private static resolveProviders(driver: TasksPersistenceDriver): Provider[] {
    if (driver === 'typeorm') {
      return [
        TasksTypeOrmDataSourceService,
        TypeOrmTasksRepositoryAdapter,
        {
          provide: TasksRepositoryPort,
          useClass: TypeOrmTasksRepositoryAdapter,
        },
      ];
    }

    if (driver === 'prisma') {
      return [
        TasksPrismaService,
        PrismaTasksRepositoryAdapter,
        {
          provide: TasksRepositoryPort,
          useClass: PrismaTasksRepositoryAdapter,
        },
      ];
    }

    return [
      TasksStoreService,
      InMemoryTasksRepositoryAdapter,
      {
        provide: TasksRepositoryPort,
        useClass: InMemoryTasksRepositoryAdapter,
      },
    ];
  }
}
