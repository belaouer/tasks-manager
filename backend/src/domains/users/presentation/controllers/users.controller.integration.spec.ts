import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('UsersController (integration)', () => {
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

  it('creates a user profile and returns it', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'users.integration@example.com',
        firstName: 'Users',
        lastName: 'Integration',
      })
      .expect(201);

    expect(typeof response.body.id).toBe('string');
    expect(response.body.email).toBe('users.integration@example.com');
    expect(response.body.firstName).toBe('Users');
    expect(response.body.lastName).toBe('Integration');

    await request(app.getHttpServer())
      .get(`/users/${response.body.id}`)
      .expect(200)
      .expect((getResponse) => {
        expect(getResponse.body.id).toBe(response.body.id);
        expect(getResponse.body.email).toBe('users.integration@example.com');
      });
  });

  it('returns 409 when creating a duplicated email', async () => {
    const payload = {
      email: 'users.duplicate@example.com',
      firstName: 'Users',
      lastName: 'Duplicate',
    };

    await request(app.getHttpServer()).post('/users').send(payload).expect(201);
    await request(app.getHttpServer()).post('/users').send(payload).expect(409);
  });

  it('returns 404 for unknown user id', async () => {
    await request(app.getHttpServer()).get('/users/unknown-id').expect(404);
  });

  it('updates user profile names', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'users.update@example.com',
        firstName: 'Before',
        lastName: 'Update',
      })
      .expect(201);

    const userId = createResponse.body.id as string;

    const updateResponse = await request(app.getHttpServer())
      .patch(`/users/${userId}`)
      .send({
        firstName: 'After',
        lastName: 'Rename',
      })
      .expect(200);

    expect(updateResponse.body.id).toBe(userId);
    expect(updateResponse.body.firstName).toBe('After');
    expect(updateResponse.body.lastName).toBe('Rename');
  });

  it('returns 404 when updating unknown user profile', async () => {
    await request(app.getHttpServer())
      .patch('/users/unknown-id')
      .send({
        firstName: 'After',
        lastName: 'Rename',
      })
      .expect(404);
  });

  it('returns 400 for invalid update payload', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'users.invalid-update@example.com',
        firstName: 'Valid',
        lastName: 'Profile',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/users/${createResponse.body.id as string}`)
      .send({
        firstName: 'A',
        lastName: '',
      })
      .expect(400);
  });

  it('returns 400 for invalid create payload', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'not-an-email',
        firstName: 'A',
        lastName: '',
      })
      .expect(400);
  });
});
