import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './domains/auth/auth.module';
import { ListsModule } from './domains/lists/lists.module';
import { TasksModule } from './domains/tasks/tasks.module';
import { UsersModule } from './domains/users/users.module';
import { envValidationSchema } from './config/env.validation';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    AuthModule,
    UsersModule,
    ListsModule,
    TasksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
