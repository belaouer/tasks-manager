import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

interface TasksAccessTokenPayload {
  readonly sub: string;
  readonly email: string;
}

interface TasksAuthenticatedRequest extends Request {
  user?: TasksAccessTokenPayload;
}

@Injectable()
export class TasksJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TasksAuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const jwtIssuer = process.env.JWT_ISSUER;
    const jwtAudience = process.env.JWT_AUDIENCE;

    if (!accessSecret || !jwtIssuer || !jwtAudience) {
      throw new UnauthorizedException('Invalid access token.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<TasksAccessTokenPayload>(
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
