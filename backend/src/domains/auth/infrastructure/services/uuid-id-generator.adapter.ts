import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IdGeneratorPort } from '../../domain/ports/id-generator.port';

@Injectable()
export class UuidIdGeneratorAdapter extends IdGeneratorPort {
  generate(): string {
    return randomUUID();
  }
}
