import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );

  if (process.env.SWAGGER_ENABLED === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Tasks Manager API')
      .setDescription('API documentation for the Auth module.')
      .setVersion('1.0.0')
      .addTag('Auth')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token returned by login/register/refresh.',
        },
        'access-token',
      )
      .addCookieAuth('refreshToken', {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'HTTP-only refresh token cookie used by /auth/refresh and /auth/logout.',
      })
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
