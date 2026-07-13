import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmUserEntity } from './typeorm-user.entity';

@Injectable()
export class UsersTypeOrmDataSourceService implements OnModuleDestroy {
  private dataSource: DataSource | null = null;

  async getDataSource(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    this.dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [TypeOrmUserEntity],
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
