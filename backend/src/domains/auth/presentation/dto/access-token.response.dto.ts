import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponseDto {
  @ApiProperty({
    description: 'Signed JWT access token (15 minutes).',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImp0aSI6IjE4ZTk4YzIwLWE3YjQtNDE4ZC1hNDRjLTE4YjA2MDFlOTQ4MSJ9...',
  })
  readonly accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}
