import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { LoginCommand } from '../../application/dto/login.command';
import { LogoutCommand } from '../../application/dto/logout.command';
import { RefreshTokenCommand } from '../../application/dto/refresh-token.command';
import { RegisterCommand } from '../../application/dto/register.command';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { AccessTokenResponseDto } from '../dto/access-token.response.dto';
import { LoginRequestDto } from '../dto/login.request.dto';
import { RegisterRequestDto } from '../dto/register.request.dto';
import { AuthExceptionFilter } from '../filters/auth-exception.filter';

@Controller('auth')
@UseFilters(AuthExceptionFilter)
@ApiTags('Auth')
export class AuthController {
  private static readonly REFRESH_COOKIE_NAME = 'refreshToken';

  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account.' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiResponse({ status: 201, type: AccessTokenResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  async register(
    @Body() body: RegisterRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponseDto> {
    const result = await this.registerUseCase.execute(
      new RegisterCommand(body.email, body.password),
    );

    this.writeRefreshCookie(response, result.refreshToken);
    return new AccessTokenResponseDto(result.accessToken);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and issue tokens.' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: AccessTokenResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponseDto> {
    const result = await this.loginUseCase.execute(
      new LoginCommand(body.email, body.password),
    );

    this.writeRefreshCookie(response, result.refreshToken);
    return new AccessTokenResponseDto(result.accessToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token.' })
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({ type: AccessTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid refresh token.' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponseDto> {
    const refreshToken = this.readRefreshCookie(request);
    if (refreshToken.length === 0) {
      throw new UnauthorizedException('Missing refresh token cookie.');
    }

    const result = await this.refreshTokenUseCase.execute(
      new RefreshTokenCommand(refreshToken),
    );

    this.writeRefreshCookie(response, result.refreshToken);
    return new AccessTokenResponseDto(result.accessToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalidate current refresh token and clear cookie.' })
  @ApiCookieAuth('refreshToken')
  @ApiNoContentResponse({ description: 'Refresh token invalidated and cookie cleared.' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = this.readRefreshCookie(request);
    if (refreshToken.length > 0) {
      await this.logoutUseCase.execute(new LogoutCommand(refreshToken));
    }

    this.clearRefreshCookie(response);
  }

  private writeRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(AuthController.REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(AuthController.REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth',
    });
  }

  private readRefreshCookie(request: Request): string {
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const candidate = cookies?.[AuthController.REFRESH_COOKIE_NAME];

    return typeof candidate === 'string' ? candidate : '';
  }
}
