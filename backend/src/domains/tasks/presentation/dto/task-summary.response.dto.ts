import { ApiProperty } from '@nestjs/swagger';
import { TaskSummaryDto } from '../../application/dto/task-summary.dto';

export class TaskSummaryResponseDto {
  @ApiProperty({ example: '9f6ef3f0-1b8d-44f4-94ef-2ad581935eb6' })
  readonly id: string;

  @ApiProperty({ example: 'a0bbf4c4-4cd2-4f5c-9f34-b61a9ad9a0b7' })
  readonly listId: string;

  @ApiProperty({ example: '39eb9f38-45f7-4e31-bdbf-c0f0c9dbcf5c' })
  readonly ownerUserId: string;

  @ApiProperty({ example: 'Buy milk' })
  readonly shortDescription: string;

  @ApiProperty({ example: 'Remember lactose free', nullable: true })
  readonly longDescription: string | null;

  @ApiProperty({ example: '2026-05-10T12:00:00.000Z' })
  readonly dueDate: string;

  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' })
  readonly createdAt: string;

  @ApiProperty({ example: '2026-05-01T12:05:00.000Z' })
  readonly updatedAt: string;

  @ApiProperty({ example: '2026-05-02T09:00:00.000Z', nullable: true })
  readonly completedAt: string | null;

  @ApiProperty({ example: false })
  readonly completed: boolean;

  constructor(summary: TaskSummaryDto) {
    this.id = summary.id;
    this.listId = summary.listId;
    this.ownerUserId = summary.ownerUserId;
    this.shortDescription = summary.shortDescription;
    this.longDescription = summary.longDescription;
    this.dueDate = summary.dueDate.toISOString();
    this.createdAt = summary.createdAt.toISOString();
    this.updatedAt = summary.updatedAt.toISOString();
    this.completedAt = summary.completedAt?.toISOString() ?? null;
    this.completed = summary.completed;
  }
}
