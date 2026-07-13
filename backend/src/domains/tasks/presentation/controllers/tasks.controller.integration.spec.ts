import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

jest.setTimeout(20000);

describe('TasksController (integration)', () => {
  let app: INestApplication;
  let ownerAccessToken: string;
  let secondAccessToken: string;
  let ownerListId: string;
  let secondListId: string;
  let ownerTaskId: string;

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
        email: 'tasks.owner@example.com',
        password: 'Password123',
        firstName: 'Owner',
        lastName: 'Task',
      })
      .expect(201);

    ownerAccessToken = ownerRegister.body.accessToken as string;

    const secondRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'tasks.second@example.com',
        password: 'Password123',
        firstName: 'Second',
        lastName: 'Task',
      })
      .expect(201);

    secondAccessToken = secondRegister.body.accessToken as string;

    const ownerList = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ name: 'Owner list' })
      .expect(201);

    ownerListId = ownerList.body.id as string;

    const secondList = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .send({ name: 'Second list' })
      .expect(201);

    secondListId = secondList.body.id as string;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates task for authenticated user in selected list', async () => {
    const response = await request(app.getHttpServer())
      .post(`/lists/${ownerListId}/tasks`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        shortDescription: 'Buy milk',
        longDescription: 'Remember lactose free',
        dueDate: '2026-06-10T12:00:00.000Z',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.listId).toBe(ownerListId);
    expect(response.body.shortDescription).toBe('Buy milk');
    expect(response.body.longDescription).toBe('Remember lactose free');
    expect(response.body.completed).toBe(false);

    ownerTaskId = response.body.id as string;
  });

  it('returns 400 for invalid create payload', async () => {
    await request(app.getHttpServer())
      .post(`/lists/${ownerListId}/tasks`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        shortDescription: '',
        dueDate: 'invalid-date',
      })
      .expect(400);
  });

  it('returns 401 when token is missing', async () => {
    await request(app.getHttpServer()).get(`/lists/${ownerListId}/tasks`).expect(401);
  });

  it('returns only tasks for authenticated user and list', async () => {
    await request(app.getHttpServer())
      .post(`/lists/${secondListId}/tasks`)
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .send({
        shortDescription: 'Other task',
        dueDate: '2026-06-11T12:00:00.000Z',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/lists/${ownerListId}/tasks`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(ownerTaskId);
  });

  it('completes and reopens own task', async () => {
    const completed = await request(app.getHttpServer())
      .patch(`/lists/${ownerListId}/tasks/${ownerTaskId}/complete`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);

    expect(completed.body.completed).toBe(true);
    expect(completed.body.completedAt).toBeDefined();

    const reopened = await request(app.getHttpServer())
      .patch(`/lists/${ownerListId}/tasks/${ownerTaskId}/reopen`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);

    expect(reopened.body.completed).toBe(false);
    expect(reopened.body.completedAt).toBeNull();
  });

  it('forbids cross-user task access', async () => {
    await request(app.getHttpServer())
      .patch(`/lists/${ownerListId}/tasks/${ownerTaskId}/complete`)
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .expect(403);
  });

  it('deletes own task', async () => {
    await request(app.getHttpServer())
      .delete(`/lists/${ownerListId}/tasks/${ownerTaskId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(204);

    const afterDelete = await request(app.getHttpServer())
      .get(`/lists/${ownerListId}/tasks`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(200);

    expect(afterDelete.body).toHaveLength(0);
  });

  it('returns 404 for non-existing task deletion', async () => {
    await request(app.getHttpServer())
      .delete(`/lists/${ownerListId}/tasks/unknown-task-id`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .expect(404);
  });
});
