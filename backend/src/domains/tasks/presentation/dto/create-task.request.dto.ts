import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTaskRequestDto {
  @ApiProperty({ example: 'Buy milk', minLength: 1, maxLength: 160 })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  readonly shortDescription!: string;

  @ApiPropertyOptional({ example: 'Remember lactose free', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly longDescription?: string;

  @ApiProperty({ example: '2026-05-10T12:00:00.000Z' })
  @IsDateString()
  readonly dueDate!: string;
}
