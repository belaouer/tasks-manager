import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { UsersRepositoryPort } from '../../../domain/ports/users-repository.port';
import { UserEmail } from '../../../domain/value-objects/user-email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import {
  toDomainUser,
  toPersistenceUser,
} from '../common/users-persistence.mapper';
import { UsersPrismaService } from './prisma.service';

@Injectable()
export class PrismaUsersRepositoryAdapter extends UsersRepositoryPort {
  constructor(private readonly prisma: UsersPrismaService) {
    super();
  }

  async findById(id: UserId): Promise<User | null> {
    const row = await this.prisma.userProfile.findUnique({
      where: { id: id.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainUser(row);
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    const row = await this.prisma.userProfile.findUnique({
      where: { email: email.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainUser(row);
  }

  async save(user: User): Promise<void> {
    const record = toPersistenceUser(user);

    await this.prisma.userProfile.create({
      data: {
        id: record.id,
        email: record.email,
        firstName: record.firstName,
        lastName: record.lastName,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }

  async update(user: User): Promise<void> {
    const record = toPersistenceUser(user);

    await this.prisma.userProfile.update({
      where: { id: record.id },
      data: {
        firstName: record.firstName,
        lastName: record.lastName,
      },
    });
  }
}
