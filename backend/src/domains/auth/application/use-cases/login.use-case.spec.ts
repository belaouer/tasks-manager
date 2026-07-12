import { LoginCommand } from '../dto/login.command';
import { InvalidCredentialsApplicationException } from '../exceptions/invalid-credentials.application-exception';
import { LoginUseCase } from './login.use-case';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { TokenIssuerPort } from '../../domain/ports/token-issuer.port';
import { ClockPort } from '../../domain/ports/clock.port';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { Email } from '../../domain/value-objects/email.value-object';

describe('LoginUseCase', () => {
  const fixedNow = new Date('2026-01-01T00:00:00.000Z');

  const buildUser = (): AuthUser =>
    AuthUser.rehydrate({
      id: UserId.create('user-1'),
      email: Email.create('john@example.com'),
      passwordHash: 'password-hash',
      refreshTokenHash: 'existing-refresh-hash',
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

  it('throws when user does not exist', async () => {
    const repository: UserRepositoryPort = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as unknown as UserRepositoryPort;

    const hasher: PasswordHasherPort = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as unknown as PasswordHasherPort;

    const tokenIssuer: TokenIssuerPort = {
      issueTokens: jest.fn(),
    } as unknown as TokenIssuerPort;

    const clock: ClockPort = {
      now: jest.fn().mockReturnValue(fixedNow),
    } as unknown as ClockPort;

    const useCase = new LoginUseCase(repository, hasher, tokenIssuer, clock);

    await expect(
      useCase.execute(new LoginCommand('john@example.com', 'Password123')),
    ).rejects.toThrow(InvalidCredentialsApplicationException);
  });

  it('returns tokens and rotates refresh hash on success', async () => {
    const user = buildUser();

    const repository: UserRepositoryPort = {
      findByEmail: jest.fn().mockResolvedValue(user),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as UserRepositoryPort;

    const hasher: PasswordHasherPort = {
      compare: jest.fn().mockResolvedValue(true),
      hash: jest.fn().mockResolvedValue('new-refresh-hash'),
    } as unknown as PasswordHasherPort;

    const tokenIssuer: TokenIssuerPort = {
      issueTokens: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    } as unknown as TokenIssuerPort;

    const clock: ClockPort = {
      now: jest.fn().mockReturnValue(fixedNow),
    } as unknown as ClockPort;

    const useCase = new LoginUseCase(repository, hasher, tokenIssuer, clock);

    const result = await useCase.execute(
      new LoginCommand('john@example.com', 'Password123'),
    );

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(hasher.hash).toHaveBeenCalledWith('refresh-token');
  });
});
