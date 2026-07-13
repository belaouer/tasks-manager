import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ListsIdGeneratorPort } from '../../domain/ports/lists-id-generator.port';

@Injectable()
export class ListsUuidIdGeneratorAdapter extends ListsIdGeneratorPort {
  generate(): string {
    return randomUUID();
  }
}
