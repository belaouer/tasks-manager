import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmTaskEntity } from './typeorm-task.entity';

@Injectable()
export class TasksTypeOrmDataSourceService implements OnModuleDestroy {
  private dataSource: DataSource | null = null;

  async getDataSource(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    this.dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [TypeOrmTaskEntity],
      synchronize: false,
    });

    return this.dataSource.initialize();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
