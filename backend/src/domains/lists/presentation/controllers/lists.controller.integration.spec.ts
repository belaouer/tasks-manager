import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

jest.setTimeout(20000);

describe('ListsController (integration)', () => {
  let app: INestApplication;
  let ownerAccessToken: string;
  let secondAccessToken: string;
  let ownerListId: string;
  let secondListId: string;

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
        email: 'lists.owner@example.com',
        emailConfirmation: 'lists.owner@example.com',
        password: 'Password123',
        passwordConfirmation: 'Password123',
        firstName: 'Owner',
        lastName: 'List',
      })
      .expect(201);

    ownerAccessToken = ownerRegister.body.accessToken as string;

    const secondRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'lists.second@example.com',
        emailConfirmation: 'lists.second@example.com',
        password: 'Password123',
        passwordConfirmation: 'Password123',
        firstName: 'Second',
        lastName: 'List',
      })
      .expect(201);

    secondAccessToken = secondRegister.body.accessToken as string;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates list for authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ name: 'Personal' })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.ownerUserId).toBeDefined();
    expect(response.body.name).toBe('Personal');
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();

    ownerListId = response.body.id as string;
  });

  it('rejects duplicate list name for same owner', async () => {
    await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ name: 'Personal' })
      .expect(409);
  });

  it('allows same list name for another owner', async () => {
    const response = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .send({ name: 'Personal' })
      .expect(201);

    secondListId = response.body.id as string;
  });

  it('returns 400 for invalid create payload', async () => {
    await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ name: '' })
      .expect(400);
  });

  it('returns only authenticated user lists', async () => {
    const response = await request(app.getHttpServer())
      .get('/lists')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);

    const ownerNames = (response.body as Array<{ name: string }>).map(
      (item) => item.name,
    );

    expect(ownerNames).toContain('Personal');
  });

  it('returns 401 when list token is missing', async () => {
    await request(app.getHttpServer()).get('/lists').expect(401);
  });

  it('forbids deleting another user list', async () => {
    await request(app.getHttpServer())
      .delete(`/lists/${secondListId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(403);
  });

  it('deletes own list', async () => {
    await request(app.getHttpServer())
      .delete(`/lists/${ownerListId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(204);

    const afterDelete = await request(app.getHttpServer())
      .get('/lists')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);

    const ids = (afterDelete.body as Array<{ id: string }>).map((item) => item.id);
    expect(ids).not.toContain(ownerListId);
  });

  it('returns 404 when deleting non-existing list', async () => {
    await request(app.getHttpServer())
      .delete('/lists/4f067f7b-89f3-4f44-95a6-f4d2467627df')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(404);
  });
});
