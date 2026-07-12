import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenPayload } from '../../domain/ports/token-issuer.port';
import { TokenVerifierPort } from '../../domain/ports/token-verifier.port';

@Injectable()
export class JwtTokenVerifierAdapter extends TokenVerifierPort {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  async verifyRefreshToken(token: string): Promise<AuthTokenPayload | null> {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtIssuer = process.env.JWT_ISSUER;
    const jwtAudience = process.env.JWT_AUDIENCE;

    if (!refreshSecret || !jwtIssuer || !jwtAudience) {
      throw new Error('JWT verification configuration is incomplete.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token, {
        secret: refreshSecret,
        issuer: jwtIssuer,
        audience: jwtAudience,
        algorithms: ['HS256'],
      });

      if (!payload.sub || !payload.email) {
        return null;
      }

      return {
        sub: payload.sub,
        email: payload.email,
      };
    } catch {
      return null;
    }
  }
}
