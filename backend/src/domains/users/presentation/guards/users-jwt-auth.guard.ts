import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

interface UsersAccessTokenPayload {
  readonly sub: string;
  readonly email: string;
}

interface UsersAuthenticatedRequest extends Request {
  user?: UsersAccessTokenPayload;
}

@Injectable()
export class UsersJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UsersAuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const jwtIssuer = process.env.JWT_ISSUER;
    const jwtAudience = process.env.JWT_AUDIENCE;

    if (!accessSecret || !jwtIssuer || !jwtAudience) {
      throw new UnauthorizedException('Invalid access token.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<UsersAccessTokenPayload>(
        token,
        {
          secret: accessSecret,
          issuer: jwtIssuer,
          audience: jwtAudience,
          algorithms: ['HS256'],
        },
      );

      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid access token payload.');
      }

      request.user = {
        sub: payload.sub,
        email: payload.email,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid access token.');
    }
  }

  static ensureResourceOwnership(
    requestedUserId: string,
    authenticatedUserId: string,
  ): void {
    if (requestedUserId !== authenticatedUserId) {
      throw new ForbiddenException('You can only access your own user profile.');
    }
  }

  private extractBearerToken(request: Request): string {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing access token.');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    if (token.length === 0) {
      throw new UnauthorizedException('Missing access token.');
    }

    return token;
  }
}
