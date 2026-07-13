import { Injectable } from '@nestjs/common';
import { TaskList } from '../../../domain/entities/task-list.entity';
import { ListsRepositoryPort } from '../../../domain/ports/lists-repository.port';
import { ListId } from '../../../domain/value-objects/list-id.value-object';
import { ListName } from '../../../domain/value-objects/list-name.value-object';
import { OwnerUserId } from '../../../domain/value-objects/owner-user-id.value-object';
import {
  toDomainTaskList,
  toPersistenceTaskList,
} from '../common/lists-persistence.mapper';
import { ListsTypeOrmDataSourceService } from './typeorm-data-source.service';
import { TypeOrmTaskListEntity } from './typeorm-task-list.entity';

@Injectable()
export class TypeOrmListsRepositoryAdapter extends ListsRepositoryPort {
  constructor(private readonly dataSourceService: ListsTypeOrmDataSourceService) {
    super();
  }

  async findById(id: ListId): Promise<TaskList | null> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskListEntity);

    const row = await repository.findOne({
      where: { id: id.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainTaskList(row);
  }

  async findByOwnerUserId(ownerUserId: OwnerUserId): Promise<TaskList[]> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskListEntity);

    const rows = await repository.find({
      where: { ownerUserId: ownerUserId.getValue() },
      order: { createdAt: 'ASC' },
    });

    return rows.map(toDomainTaskList);
  }

  async findByOwnerUserIdAndName(
    ownerUserId: OwnerUserId,
    name: ListName,
  ): Promise<TaskList | null> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskListEntity);

    const row = await repository.findOne({
      where: {
        ownerUserId: ownerUserId.getValue(),
        name: name.getValue(),
      },
    });

    if (row === null) {
      return null;
    }

    return toDomainTaskList(row);
  }

  async save(taskList: TaskList): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskListEntity);
    const record = toPersistenceTaskList(taskList);

    await repository.save({
      id: record.id,
      ownerUserId: record.ownerUserId,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async update(taskList: TaskList): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskListEntity);
    const record = toPersistenceTaskList(taskList);

    await repository.update(
      { id: record.id },
      {
        name: record.name,
      },
    );
  }

  async deleteById(id: ListId): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmTaskListEntity);

    await repository.delete({ id: id.getValue() });
  }
}
