import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('AuthController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.PERSISTENCE_DRIVER = 'in-memory';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ISSUER = 'tasks-manager-tests';
    process.env.JWT_AUDIENCE = 'tasks-manager-tests-api';

    const { AppModule } = require('../../../../app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('register sets refresh cookie and returns access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'register.integration@example.com',
        emailConfirmation: 'register.integration@example.com',
        password: 'Password123',
        passwordConfirmation: 'Password123',
        firstName: 'Register',
        lastName: 'Integration',
      })
      .expect(201);

    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.accessToken.length).toBeGreaterThan(0);

    const refreshCookie = extractRefreshCookie(response.header['set-cookie']);
    expect(refreshCookie).not.toBeNull();
  });

  it('login then refresh rotates cookie and returns a new access token', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'refresh.integration@example.com',
        emailConfirmation: 'refresh.integration@example.com',
        password: 'Password123',
        passwordConfirmation: 'Password123',
        firstName: 'Refresh',
        lastName: 'Integration',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'refresh.integration@example.com',
        password: 'Password123',
      })
      .expect(200);

    const loginCookie = extractRefreshCookie(loginResponse.header['set-cookie']);
    expect(loginCookie).not.toBeNull();

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [loginCookie as string])
      .expect(200);

    const rotatedCookie = extractRefreshCookie(refreshResponse.header['set-cookie']);
    expect(rotatedCookie).not.toBeNull();

    expect(typeof refreshResponse.body.accessToken).toBe('string');
    expect(refreshResponse.body.accessToken.length).toBeGreaterThan(0);

  });

  it('logout clears refresh cookie and refresh is rejected afterwards', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'logout.integration@example.com',
        emailConfirmation: 'logout.integration@example.com',
        password: 'Password123',
        passwordConfirmation: 'Password123',
        firstName: 'Logout',
        lastName: 'Integration',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'logout.integration@example.com',
        password: 'Password123',
      })
      .expect(200);

    const loginCookie = extractRefreshCookie(loginResponse.header['set-cookie']);

    const logoutResponse = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', [loginCookie as string])
      .expect(204);

    const clearCookieHeader = (logoutResponse.header['set-cookie'] ?? []).join(';');
    expect(clearCookieHeader).toContain('refreshToken=');

    await request(app.getHttpServer()).post('/auth/refresh').expect(401);
  });
});

function extractRefreshCookie(setCookieHeader: string[] | undefined): string | null {
  if (!setCookieHeader || setCookieHeader.length === 0) {
    return null;
  }

  for (const cookie of setCookieHeader) {
    if (cookie.startsWith('refreshToken=')) {
      return cookie.split(';')[0];
    }
  }

  return null;
}
