import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';

jest.setTimeout(30000);

describe('TasksGateway (integration)', () => {
  let app: INestApplication;
  let baseUrl: string;

  let ownerAccessToken: string;
  let ownerListId: string;

  let secondAccessToken: string;
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
    await app.listen(0);

    const address = app.getHttpServer().address() as { port: number };
    baseUrl = `http://127.0.0.1:${address.port}`;

    const ownerRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'gateway.owner@example.com',
        password: 'Password123',
        firstName: 'Owner',
        lastName: 'Gateway',
      })
      .expect(201);

    ownerAccessToken = ownerRegister.body.accessToken as string;

    const ownerList = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ name: 'Gateway owner list' })
      .expect(201);

    ownerListId = ownerList.body.id as string;

    const secondRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'gateway.second@example.com',
        password: 'Password123',
        firstName: 'Second',
        lastName: 'Gateway',
      })
      .expect(201);

    secondAccessToken = secondRegister.body.accessToken as string;

    const secondList = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .send({ name: 'Gateway second list' })
      .expect(201);

    secondListId = secondList.body.id as string;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('rejects websocket connection without token', async () => {
    const socket = io(`${baseUrl}/tasks`, {
      autoConnect: false,
      reconnection: false,
      timeout: 2000,
    });

    try {
      const rejected = await waitForConnectionRejection(socket);
      expect(rejected).toBe(true);
    } finally {
      socket.disconnect();
    }
  });

  it('emits task events only to joined list room', async () => {
    const ownerSocket = createAuthenticatedSocket(baseUrl, ownerAccessToken);
    const secondSocket = createAuthenticatedSocket(baseUrl, secondAccessToken);

    try {
      await Promise.all([waitForConnect(ownerSocket), waitForConnect(secondSocket)]);

      ownerSocket.emit('lists:join', { listId: ownerListId });
      secondSocket.emit('lists:join', { listId: secondListId });

      const ownerCreatedEventPromise = waitForEvent(ownerSocket, 'task:created');

      let secondReceivedTaskCreated = false;
      secondSocket.on('task:created', () => {
        secondReceivedTaskCreated = true;
      });

      const createResponse = await request(app.getHttpServer())
        .post(`/lists/${ownerListId}/tasks`)
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .send({
          shortDescription: 'Gateway task',
          dueDate: '2026-07-20T12:00:00.000Z',
        })
        .expect(201);

      const ownerTaskId = createResponse.body.id as string;

      const ownerCreatedPayload = await ownerCreatedEventPromise;
      expect(ownerCreatedPayload.id).toBe(ownerTaskId);
      expect(ownerCreatedPayload.listId).toBe(ownerListId);

      await delay(300);
      expect(secondReceivedTaskCreated).toBe(false);

      const ownerCompletedEventPromise = waitForEvent(ownerSocket, 'task:completed');
      await request(app.getHttpServer())
        .patch(`/lists/${ownerListId}/tasks/${ownerTaskId}/complete`)
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .expect(200);

      const ownerCompletedPayload = await ownerCompletedEventPromise;
      expect(ownerCompletedPayload.id).toBe(ownerTaskId);
      expect(ownerCompletedPayload.completed).toBe(true);

      const ownerUpdatedEventPromise = waitForEvent(ownerSocket, 'task:updated');
      await request(app.getHttpServer())
        .patch(`/lists/${ownerListId}/tasks/${ownerTaskId}/reopen`)
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .expect(200);

      const ownerUpdatedPayload = await ownerUpdatedEventPromise;
      expect(ownerUpdatedPayload.id).toBe(ownerTaskId);
      expect(ownerUpdatedPayload.completed).toBe(false);

      const ownerDeletedEventPromise = waitForEvent(ownerSocket, 'task:deleted');
      await request(app.getHttpServer())
        .delete(`/lists/${ownerListId}/tasks/${ownerTaskId}`)
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .expect(204);

      const ownerDeletedPayload = await ownerDeletedEventPromise;
      expect(ownerDeletedPayload.taskId).toBe(ownerTaskId);
      expect(ownerDeletedPayload.listId).toBe(ownerListId);

      ownerSocket.emit('lists:leave', { listId: ownerListId });
      secondSocket.emit('lists:leave', { listId: secondListId });
    } finally {
      ownerSocket.disconnect();
      secondSocket.disconnect();
    }
  });
});

function createAuthenticatedSocket(baseUrl: string, accessToken: string): Socket {
  return io(`${baseUrl}/tasks`, {
    autoConnect: false,
    reconnection: false,
    timeout: 3000,
    auth: {
      token: accessToken,
    },
  });
}

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Socket connection timeout.'));
    }, 3000);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onConnectError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.connect();
  });
}

function waitForConnectionRejection(socket: Socket): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(!socket.connected);
    }, 2000);

    const onDisconnect = () => {
      cleanup();
      resolve(true);
    };

    const onConnectError = () => {
      cleanup();
      resolve(true);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };

    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.connect();
  });
}

function waitForEvent<T = unknown>(socket: Socket, event: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout while waiting for event ${event}.`));
    }, 3000);

    const handler = (payload: T) => {
      cleanup();
      resolve(payload);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off(event, handler);
    };

    socket.on(event, handler);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
