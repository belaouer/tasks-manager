import { Injectable } from '@nestjs/common';
import { Task } from '../../../domain/entities/task.entity';
import { TasksRepositoryPort } from '../../../domain/ports/tasks-repository.port';
import { TaskId } from '../../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../../domain/value-objects/task-list-id.value-object';
import { TaskOwnerUserId } from '../../../domain/value-objects/task-owner-user-id.value-object';
import { toDomainTask, toPersistenceTask } from '../common/tasks-persistence.mapper';
import { TasksTypeOrmDataSourceService } from './typeorm-data-source.service';
import { TypeOrmTaskEntity } from './typeorm-task.entity';

@Injectable()
export class TypeOrmTasksRepositoryAdapter extends TasksRepositoryPort {
  constructor(private readonly dataSourceService: TasksTypeOrmDataSourceService) {
    super();
  }

  async findById(id: TaskId): Promise<Task | null> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskEntity);

    const row = await repository.findOne({
      where: { id: id.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainTask(row);
  }

  async findByListIdAndOwnerUserId(
    listId: TaskListId,
    ownerUserId: TaskOwnerUserId,
  ): Promise<Task[]> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskEntity);

    const rows = await repository.find({
      where: {
        listId: listId.getValue(),
        ownerUserId: ownerUserId.getValue(),
      },
      order: { createdAt: 'ASC' },
    });

    return rows.map(toDomainTask);
  }

  async save(task: Task): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskEntity);
    const record = toPersistenceTask(task);

    await repository.save({
      id: record.id,
      listId: record.listId,
      ownerUserId: record.ownerUserId,
      shortDescription: record.shortDescription,
      longDescription: record.longDescription,
      dueDate: record.dueDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      completedAt: record.completedAt,
    });
  }

  async update(task: Task): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskEntity);
    const record = toPersistenceTask(task);

    await repository.update(
      { id: record.id },
      {
        shortDescription: record.shortDescription,
        longDescription: record.longDescription,
        dueDate: record.dueDate,
        updatedAt: record.updatedAt,
        completedAt: record.completedAt,
      },
    );
  }

  async deleteById(id: TaskId): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskEntity);

    await repository.delete({ id: id.getValue() });
  }
}
