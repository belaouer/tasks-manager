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
import { ListsPrismaService } from './prisma.service';

@Injectable()
export class PrismaListsRepositoryAdapter extends ListsRepositoryPort {
  constructor(private readonly prisma: ListsPrismaService) {
    super();
  }

  async findById(id: ListId): Promise<TaskList | null> {
    const row = await this.prisma.taskList.findUnique({
      where: { id: id.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainTaskList(row);
  }

  async findByOwnerUserId(ownerUserId: OwnerUserId): Promise<TaskList[]> {
    const rows = await this.prisma.taskList.findMany({
      where: { ownerUserId: ownerUserId.getValue() },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toDomainTaskList);
  }

  async findByOwnerUserIdAndName(
    ownerUserId: OwnerUserId,
    name: ListName,
  ): Promise<TaskList | null> {
    const row = await this.prisma.taskList.findFirst({
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
    const record = toPersistenceTaskList(taskList);

    await this.prisma.taskList.create({
      data: {
        id: record.id,
        ownerUserId: record.ownerUserId,
        name: record.name,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }

  async update(taskList: TaskList): Promise<void> {
    const record = toPersistenceTaskList(taskList);

    await this.prisma.taskList.update({
      where: { id: record.id },
      data: {
        name: record.name,
      },
    });
  }

  async deleteById(id: ListId): Promise<void> {
    await this.prisma.taskList.delete({
      where: { id: id.getValue() },
    });
  }
}
