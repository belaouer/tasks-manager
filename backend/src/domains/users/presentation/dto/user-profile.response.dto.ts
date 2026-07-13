import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../application/dto/user-profile.dto';

export class UserProfileResponseDto {
  @ApiProperty({ example: 'a0bbf4c4-4cd2-4f5c-9f34-b61a9ad9a0b7' })
  readonly id: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  readonly email: string;

  @ApiProperty({ example: 'Jane' })
  readonly firstName: string;

  @ApiProperty({ example: 'Doe' })
  readonly lastName: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  readonly createdAt: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  readonly updatedAt: string;

  constructor(profile: UserProfileDto) {
    this.id = profile.id;
    this.email = profile.email;
    this.firstName = profile.firstName;
    this.lastName = profile.lastName;
    this.createdAt = profile.createdAt.toISOString();
    this.updatedAt = profile.updatedAt.toISOString();
  }
}
