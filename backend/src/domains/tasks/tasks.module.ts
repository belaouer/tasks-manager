import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
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
import { TasksController } from './presentation/controllers/tasks.controller';
import { TasksJwtAuthGuard } from './presentation/guards/tasks-jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({}),
    TasksPersistenceModule.register({
      driver: resolveTasksPersistenceDriver(process.env.PERSISTENCE_DRIVER),
    }),
  ],
  controllers: [TasksController],
  providers: [
    CreateTaskUseCase,
    GetListTasksUseCase,
    CompleteTaskUseCase,
    ReopenTaskUseCase,
    DeleteTaskUseCase,
    TasksJwtAuthGuard,
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
