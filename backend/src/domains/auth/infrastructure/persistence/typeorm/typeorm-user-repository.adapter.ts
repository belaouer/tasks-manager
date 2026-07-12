import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../../domain/entities/auth-user.entity';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { Email } from '../../../domain/value-objects/email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import {
  toDomainAuthUser,
  toPersistenceAuthUser,
} from '../common/auth-user-persistence.mapper';
import { TypeOrmAuthUserEntity } from './typeorm-auth-user.entity';
import { TypeOrmDataSourceService } from './typeorm-data-source.service';

@Injectable()
export class TypeOrmUserRepositoryAdapter extends UserRepositoryPort {
  constructor(private readonly dataSourceService: TypeOrmDataSourceService) {
    super();
  }

  async findByEmail(email: Email): Promise<AuthUser | null> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmAuthUserEntity);
    const row = await repository.findOne({
      where: { email: email.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainAuthUser(row);
  }

  async findById(userId: UserId): Promise<AuthUser | null> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmAuthUserEntity);
    const row = await repository.findOne({
      where: { id: userId.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainAuthUser(row);
  }

  async save(user: AuthUser): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmAuthUserEntity);
    const dto = toPersistenceAuthUser(user);

    await repository.save({
      id: dto.id,
      email: dto.email,
      passwordHash: dto.passwordHash,
      refreshTokenHash: dto.refreshTokenHash,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  async update(user: AuthUser): Promise<void> {
    const dataSource = await this.dataSourceService.getDataSource();
    const repository = dataSource.getRepository(TypeOrmAuthUserEntity);
    const dto = toPersistenceAuthUser(user);

    await repository.update(
      { id: dto.id },
      {
        email: dto.email,
        passwordHash: dto.passwordHash,
        refreshTokenHash: dto.refreshTokenHash,
      },
    );
  }
}
