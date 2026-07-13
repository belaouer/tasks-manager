import {
  IsEmail,
  IsString,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'matchesField', async: false })
class MatchesFieldConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    const [targetFieldName] = args.constraints as [string];
    const targetValue = (args.object as Record<string, unknown>)[targetFieldName];

    return typeof targetValue === 'string' && value === targetValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [targetFieldName] = args.constraints as [string];
    return `${args.property} must match ${targetFieldName}.`;
  }
}

export class RegisterRequestDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @Validate(MatchesFieldConstraint, ['email'])
  readonly emailConfirmation!: string;

  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  readonly password!: string;

  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Validate(MatchesFieldConstraint, ['password'])
  readonly passwordConfirmation!: string;

  @ApiProperty({ example: 'John', minLength: 2 })
  @IsString()
  @MinLength(2)
  readonly firstName!: string;

  @ApiProperty({ example: 'Doe', minLength: 2 })
  @IsString()
  @MinLength(2)
  readonly lastName!: string;
}
