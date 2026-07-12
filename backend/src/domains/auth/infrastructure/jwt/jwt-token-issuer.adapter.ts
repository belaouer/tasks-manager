import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import {
  AuthTokenPayload,
  IssuedAuthTokens,
  TokenIssuerPort,
} from '../../domain/ports/token-issuer.port';

@Injectable()
export class JwtTokenIssuerAdapter extends TokenIssuerPort {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  async issueTokens(payload: AuthTokenPayload): Promise<IssuedAuthTokens> {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtIssuer = process.env.JWT_ISSUER;
    const jwtAudience = process.env.JWT_AUDIENCE;

    if (!accessSecret || !refreshSecret || !jwtIssuer || !jwtAudience) {
      throw new Error('JWT configuration is incomplete.');
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: '15m',
      jwtid: randomUUID(),
      issuer: jwtIssuer,
      audience: jwtAudience,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
      jwtid: randomUUID(),
      issuer: jwtIssuer,
      audience: jwtAudience,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
