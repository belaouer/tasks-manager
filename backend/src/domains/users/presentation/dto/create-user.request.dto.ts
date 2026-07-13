import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({ example: 'Jane', minLength: 2 })
  @IsString()
  @MinLength(2)
  readonly firstName!: string;

  @ApiProperty({ example: 'Doe', minLength: 2 })
  @IsString()
  @MinLength(2)
  readonly lastName!: string;
}
