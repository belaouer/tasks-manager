import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateUserProfileRequestDto {
  @ApiProperty({ example: 'Jane', minLength: 2 })
  @IsString()
  @MinLength(2)
  readonly firstName!: string;

  @ApiProperty({ example: 'Updated', minLength: 2 })
  @IsString()
  @MinLength(2)
  readonly lastName!: string;
}
