import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'Jane', minLength: 2 })
  @IsString()
  @MinLength(2)
  readonly firstName!: string;

  @ApiProperty({ example: 'Doe', minLength: 2 })
  @IsString()
  @MinLength(2)
  readonly lastName!: string;
}
