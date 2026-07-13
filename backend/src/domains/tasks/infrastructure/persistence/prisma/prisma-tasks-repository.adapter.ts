import { Injectable } from '@nestjs/common';
import { Task } from '../../../domain/entities/task.entity';
import { TasksRepositoryPort } from '../../../domain/ports/tasks-repository.port';
import { TaskId } from '../../../domain/value-objects/task-id.value-object';
import { TaskListId } from '../../../domain/value-objects/task-list-id.value-object';
import { TaskOwnerUserId } from '../../../domain/value-objects/task-owner-user-id.value-object';
import { toDomainTask, toPersistenceTask } from '../common/tasks-persistence.mapper';
import { TasksPrismaService } from './prisma.service';

@Injectable()
export class PrismaTasksRepositoryAdapter extends TasksRepositoryPort {
  constructor(private readonly prisma: TasksPrismaService) {
    super();
  }

  async findById(id: TaskId): Promise<Task | null> {
    const row = await this.prisma.task.findUnique({
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
    const rows = await this.prisma.task.findMany({
      where: {
        listId: listId.getValue(),
        ownerUserId: ownerUserId.getValue(),
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toDomainTask);
  }

  async save(task: Task): Promise<void> {
    const record = toPersistenceTask(task);

    await this.prisma.task.create({
      data: {
        id: record.id,
        listId: record.listId,
        ownerUserId: record.ownerUserId,
        shortDescription: record.shortDescription,
        longDescription: record.longDescription,
        dueDate: record.dueDate,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        completedAt: record.completedAt,
      },
    });
  }

  async update(task: Task): Promise<void> {
    const record = toPersistenceTask(task);

    await this.prisma.task.update({
      where: { id: record.id },
      data: {
        shortDescription: record.shortDescription,
        longDescription: record.longDescription,
        dueDate: record.dueDate,
        updatedAt: record.updatedAt,
        completedAt: record.completedAt,
      },
    });
  }

  async deleteById(id: TaskId): Promise<void> {
    await this.prisma.task.delete({
      where: { id: id.getValue() },
    });
  }
}
