import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  readonly password!: string;
}
