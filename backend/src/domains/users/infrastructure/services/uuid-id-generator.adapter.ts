import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UsersIdGeneratorPort } from '../../domain/ports/users-id-generator.port';

@Injectable()
export class UsersUuidIdGeneratorAdapter extends UsersIdGeneratorPort {
  generate(): string {
    return randomUUID();
  }
}
