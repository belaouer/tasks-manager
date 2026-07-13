import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('UsersController (integration)', () => {
  let app: INestApplication;
  let ownerAccessToken: string;
  let ownerUserId: string;
  let secondAccessToken: string;
  let secondUserId: string;

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

    const ownerRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'users.owner@example.com',
        password: 'Password123',
        firstName: 'Owner',
        lastName: 'User',
      })
      .expect(201);

    ownerAccessToken = ownerRegister.body.accessToken as string;

    const ownerProfile = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);

    ownerUserId = ownerProfile.body.id as string;

    const secondRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'users.second@example.com',
        password: 'Password123',
        firstName: 'Second',
        lastName: 'User',
      })
      .expect(201);

    secondAccessToken = secondRegister.body.accessToken as string;

    const secondProfile = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .expect(200);

    secondUserId = secondProfile.body.id as string;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('gets own profile with /users/me', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);

    expect(response.body.id).toBe(ownerUserId);
    expect(response.body.email).toBe('users.owner@example.com');
    expect(response.body.firstName).toBe('Owner');
    expect(response.body.lastName).toBe('User');
  });

  it('returns 401 when token is missing', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('returns 403 when accessing another user profile', async () => {
    await request(app.getHttpServer())
      .get(`/users/${secondUserId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(403);
  });

  it('updates own user profile names', async () => {
    const updateResponse = await request(app.getHttpServer())
      .patch(`/users/${ownerUserId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        firstName: 'After',
        lastName: 'Rename',
      })
      .expect(200);

    expect(updateResponse.body.id).toBe(ownerUserId);
    expect(updateResponse.body.firstName).toBe('After');
    expect(updateResponse.body.lastName).toBe('Rename');
  });

  it('returns 403 when updating another user profile', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${secondUserId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        firstName: 'After',
        lastName: 'Rename',
      })
      .expect(403);
  });

  it('returns 400 for invalid update payload', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${ownerUserId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        firstName: 'A',
        lastName: '',
      })
      .expect(400);
  });

  it('returns 400 for invalid /users create payload', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        firstName: 'A',
        lastName: '',
      })
      .expect(400);
  });

  it('returns 409 when trying to create profile twice for same identity', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        firstName: 'Owner',
        lastName: 'User',
      })
      .expect(409);
  });
});
