import { Module } from '@nestjs/common';
import { CompleteTaskUseCase } from './application/use-cases/complete-task.use-case';
import { CreateTaskUseCase } from './application/use-cases/create-task.use-case';
import { DeleteTaskUseCase } from './application/use-cases/delete-task.use-case';
import { GetListTasksUseCase } from './application/use-cases/get-list-tasks.use-case';
import { ReopenTaskUseCase } from './application/use-cases/reopen-task.use-case';
import { TasksClockPort } from './domain/ports/tasks-clock.port';
import { TasksIdGeneratorPort } from './domain/ports/tasks-id-generator.port';
import { TasksPersistenceModule } from './infrastructure/persistence/persistence.module';
import { resolveTasksPersistenceDriver } from './infrastructure/persistence/persistence-driver.type';
import { TasksSystemClockAdapter } from './infrastructure/services/system-clock.adapter';
import { TasksUuidIdGeneratorAdapter } from './infrastructure/services/uuid-id-generator.adapter';

@Module({
  imports: [
    TasksPersistenceModule.register({
      driver: resolveTasksPersistenceDriver(process.env.PERSISTENCE_DRIVER),
    }),
  ],
  controllers: [],
  providers: [
    CreateTaskUseCase,
    GetListTasksUseCase,
    CompleteTaskUseCase,
    ReopenTaskUseCase,
    DeleteTaskUseCase,
    {
      provide: TasksClockPort,
      useClass: TasksSystemClockAdapter,
    },
    {
      provide: TasksIdGeneratorPort,
      useClass: TasksUuidIdGeneratorAdapter,
    },
  ],
  exports: [
    CreateTaskUseCase,
    GetListTasksUseCase,
    CompleteTaskUseCase,
    ReopenTaskUseCase,
    DeleteTaskUseCase,
  ],
})
export class TasksModule {}
