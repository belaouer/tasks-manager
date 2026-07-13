import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TasksIdGeneratorPort } from '../../domain/ports/tasks-id-generator.port';

@Injectable()
export class TasksUuidIdGeneratorAdapter extends TasksIdGeneratorPort {
  generate(): string {
    return randomUUID();
  }
}
