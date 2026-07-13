import { ApiProperty } from '@nestjs/swagger';
import { ListSummaryDto } from '../../application/dto/list-summary.dto';

export class ListSummaryResponseDto {
  @ApiProperty({ example: '9f6ef3f0-1b8d-44f4-94ef-2ad581935eb6' })
  readonly id: string;

  @ApiProperty({ example: 'a0bbf4c4-4cd2-4f5c-9f34-b61a9ad9a0b7' })
  readonly ownerUserId: string;

  @ApiProperty({ example: 'Personal' })
  readonly name: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  readonly createdAt: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  readonly updatedAt: string;

  constructor(summary: ListSummaryDto) {
    this.id = summary.id;
    this.ownerUserId = summary.ownerUserId;
    this.name = summary.name;
    this.createdAt = summary.createdAt.toISOString();
    this.updatedAt = summary.updatedAt.toISOString();
  }
}
