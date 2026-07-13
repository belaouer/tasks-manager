import { Module } from '@nestjs/common';
import { CreateListUseCase } from './application/use-cases/create-list.use-case';
import { DeleteListUseCase } from './application/use-cases/delete-list.use-case';
import { GetUserListsUseCase } from './application/use-cases/get-user-lists.use-case';
import { ListsClockPort } from './domain/ports/lists-clock.port';
import { ListsIdGeneratorPort } from './domain/ports/lists-id-generator.port';
import { ListsPersistenceModule } from './infrastructure/persistence/persistence.module';
import { resolveListsPersistenceDriver } from './infrastructure/persistence/persistence-driver.type';
import { ListsSystemClockAdapter } from './infrastructure/services/system-clock.adapter';
import { ListsUuidIdGeneratorAdapter } from './infrastructure/services/uuid-id-generator.adapter';

@Module({
  imports: [
    ListsPersistenceModule.register({
      driver: resolveListsPersistenceDriver(process.env.PERSISTENCE_DRIVER),
    }),
  ],
  controllers: [],
  providers: [
    CreateListUseCase,
    GetUserListsUseCase,
    DeleteListUseCase,
    {
      provide: ListsClockPort,
      useClass: ListsSystemClockAdapter,
    },
    {
      provide: ListsIdGeneratorPort,
      useClass: ListsUuidIdGeneratorAdapter,
    },
  ],
  exports: [CreateListUseCase, GetUserListsUseCase, DeleteListUseCase],
})
export class ListsModule {}
