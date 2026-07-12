import { RefreshTokenCommand } from '../dto/refresh-token.command';
import { InvalidRefreshTokenApplicationException } from '../exceptions/invalid-refresh-token.application-exception';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TokenVerifierPort } from '../../domain/ports/token-verifier.port';
import { TokenIssuerPort } from '../../domain/ports/token-issuer.port';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { ClockPort } from '../../domain/ports/clock.port';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { Email } from '../../domain/value-objects/email.value-object';

describe('RefreshTokenUseCase', () => {
  const fixedNow = new Date('2026-01-01T00:00:00.000Z');

  const buildUser = (): AuthUser =>
    AuthUser.rehydrate({
      id: UserId.create('user-1'),
      email: Email.create('john@example.com'),
      passwordHash: 'password-hash',
      refreshTokenHash: 'stored-refresh-hash',
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

  it('throws when refresh token payload is invalid', async () => {
    const repository: UserRepositoryPort = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as unknown as UserRepositoryPort;

    const verifier: TokenVerifierPort = {
      verifyRefreshToken: jest.fn().mockResolvedValue(null),
    } as unknown as TokenVerifierPort;

    const issuer: TokenIssuerPort = {
      issueTokens: jest.fn(),
    } as unknown as TokenIssuerPort;

    const hasher: PasswordHasherPort = {
      compare: jest.fn(),
      hash: jest.fn(),
    } as unknown as PasswordHasherPort;

    const clock: ClockPort = {
      now: jest.fn().mockReturnValue(fixedNow),
    } as unknown as ClockPort;

    const useCase = new RefreshTokenUseCase(
      repository,
      verifier,
      issuer,
      hasher,
      clock,
    );

    await expect(
      useCase.execute(new RefreshTokenCommand('invalid-token')),
    ).rejects.toThrow(InvalidRefreshTokenApplicationException);
  });

  it('returns new tokens and rotates refresh hash on success', async () => {
    const user = buildUser();

    const repository: UserRepositoryPort = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue(user),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as UserRepositoryPort;

    const verifier: TokenVerifierPort = {
      verifyRefreshToken: jest.fn().mockResolvedValue({
        sub: 'user-1',
        email: 'john@example.com',
      }),
    } as unknown as TokenVerifierPort;

    const issuer: TokenIssuerPort = {
      issueTokens: jest.fn().mockResolvedValue({
        accessToken: 'next-access-token',
        refreshToken: 'next-refresh-token',
      }),
    } as unknown as TokenIssuerPort;

    const hasher: PasswordHasherPort = {
      compare: jest.fn().mockResolvedValue(true),
      hash: jest.fn().mockResolvedValue('rotated-refresh-hash'),
    } as unknown as PasswordHasherPort;

    const clock: ClockPort = {
      now: jest.fn().mockReturnValue(fixedNow),
    } as unknown as ClockPort;

    const useCase = new RefreshTokenUseCase(
      repository,
      verifier,
      issuer,
      hasher,
      clock,
    );

    const result = await useCase.execute(
      new RefreshTokenCommand('current-refresh-token'),
    );

    expect(result).toEqual({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });

    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(hasher.compare).toHaveBeenCalledWith(
      'current-refresh-token',
      'stored-refresh-hash',
    );
    expect(hasher.hash).toHaveBeenCalledWith('next-refresh-token');
  });
});
