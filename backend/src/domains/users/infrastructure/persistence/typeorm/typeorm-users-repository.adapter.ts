import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { UsersRepositoryPort } from '../../../domain/ports/users-repository.port';
import { UserEmail } from '../../../domain/value-objects/user-email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import {
  toDomainUser,
  toPersistenceUser,
} from '../common/users-persistence.mapper';
import { UsersTypeOrmDataSourceService } from './typeorm-data-source.service';
import { TypeOrmUserEntity } from './typeorm-user.entity';

@Injectable()
export class TypeOrmUsersRepositoryAdapter extends UsersRepositoryPort {
  constructor(private readonly dataSourceService: UsersTypeOrmDataSourceService) {
    super();
  }

  async findById(id: UserId): Promise<User | null> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmUserEntity);

    const row = await repository.findOne({
      where: { id: id.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainUser(row);
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmUserEntity);

    const row = await repository.findOne({
      where: { email: email.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainUser(row);
  }

  async save(user: User): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmUserEntity);
    const record = toPersistenceUser(user);

    await repository.save({
      id: record.id,
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async update(user: User): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmUserEntity);
    const record = toPersistenceUser(user);

    await repository.update(
      { id: record.id },
      {
        firstName: record.firstName,
        lastName: record.lastName,
      },
    );
  }
}
