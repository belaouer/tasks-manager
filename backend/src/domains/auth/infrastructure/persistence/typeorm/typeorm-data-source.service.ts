import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmAuthUserEntity } from './typeorm-auth-user.entity';

@Injectable()
export class TypeOrmDataSourceService implements OnModuleDestroy {
  private dataSource: DataSource | null = null;

  async getDataSource(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    this.dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [TypeOrmAuthUserEntity],
      synchronize: false,
    });

    await this.dataSource.initialize();
    return this.dataSource;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
