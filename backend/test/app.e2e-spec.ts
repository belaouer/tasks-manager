import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';

describe('Auth + Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.PERSISTENCE_DRIVER = 'in-memory';
    process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
    process.env.JWT_ISSUER = 'tasks-manager-e2e';
    process.env.JWT_AUDIENCE = 'tasks-manager-e2e-api';

    const { AppModule } = require('./../src/app.module');

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

  it('rejects invalid register payload', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'not-an-email',
        password: 'short',
        firstName: 'A',
        lastName: '',
      })
      .expect(400);
  });

  it('register -> login -> refresh -> logout flow', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'auth.e2e@example.com',
        password: 'Password123',
        firstName: 'Auth',
        lastName: 'E2E',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'auth.e2e@example.com',
        password: 'Password123',
      })
      .expect(200);

    expect(typeof loginResponse.body.accessToken).toBe('string');
    expect(loginResponse.body.accessToken.length).toBeGreaterThan(0);

    const loginCookie = extractRefreshCookie(loginResponse.header['set-cookie']);
    expect(loginCookie).not.toBeNull();

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [loginCookie as string])
      .expect(200);

    expect(typeof refreshResponse.body.accessToken).toBe('string');
    expect(refreshResponse.body.accessToken.length).toBeGreaterThan(0);

    const rotatedCookie = extractRefreshCookie(refreshResponse.header['set-cookie']);
    expect(rotatedCookie).not.toBeNull();

    const logoutResponse = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', [rotatedCookie as string])
      .expect(204);

    const clearCookieHeader = (logoutResponse.header['set-cookie'] ?? []).join(';');
    expect(clearCookieHeader).toContain('refreshToken=');

    return request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [rotatedCookie as string])
      .expect(401);
  });

  it('register -> users/me -> users/:id ownership flow', async () => {
    const ownerRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'owner.e2e@example.com',
        password: 'Password123',
        firstName: 'Owner',
        lastName: 'E2E',
      })
      .expect(201);

    const ownerAccessToken = ownerRegisterResponse.body.accessToken as string;

    const ownerProfileResponse = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', bearer(ownerAccessToken))
      .expect(200);

    const ownerId = ownerProfileResponse.body.id as string;
    expect(ownerProfileResponse.body.email).toBe('owner.e2e@example.com');

    await request(app.getHttpServer())
      .get(`/users/${ownerId}`)
      .set('Authorization', bearer(ownerAccessToken))
      .expect(200);

    const secondRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'second.e2e@example.com',
        password: 'Password123',
        firstName: 'Second',
        lastName: 'E2E',
      })
      .expect(201);

    const secondAccessToken = secondRegisterResponse.body.accessToken as string;
    const secondProfileResponse = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', bearer(secondAccessToken))
      .expect(200);

    const secondId = secondProfileResponse.body.id as string;

    await request(app.getHttpServer())
      .get(`/users/${secondId}`)
      .set('Authorization', bearer(ownerAccessToken))
      .expect(403);
  });
});

function bearer(accessToken: string): string {
  return `Bearer ${accessToken}`;
}

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
