import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../../domain/entities/auth-user.entity';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { Email } from '../../../domain/value-objects/email.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import {
  toDomainAuthUser,
  toPersistenceAuthUser,
} from '../common/auth-user-persistence.mapper';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepositoryAdapter extends UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByEmail(email: Email): Promise<AuthUser | null> {
    const row = await this.prisma.authUser.findUnique({
      where: { email: email.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainAuthUser(row);
  }

  async findById(userId: UserId): Promise<AuthUser | null> {
    const row = await this.prisma.authUser.findUnique({
      where: { id: userId.getValue() },
    });

    if (row === null) {
      return null;
    }

    return toDomainAuthUser(row);
  }

  async save(user: AuthUser): Promise<void> {
    const dto = toPersistenceAuthUser(user);

    await this.prisma.authUser.create({
      data: {
        id: dto.id,
        email: dto.email,
        passwordHash: dto.passwordHash,
        refreshTokenHash: dto.refreshTokenHash,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
      },
    });
  }

  async update(user: AuthUser): Promise<void> {
    const dto = toPersistenceAuthUser(user);

    await this.prisma.authUser.update({
      where: { id: dto.id },
      data: {
        email: dto.email,
        passwordHash: dto.passwordHash,
        refreshTokenHash: dto.refreshTokenHash,
      },
    });
  }
}
