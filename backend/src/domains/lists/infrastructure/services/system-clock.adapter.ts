import { Injectable } from '@nestjs/common';
import { ListsClockPort } from '../../domain/ports/lists-clock.port';

@Injectable()
export class ListsSystemClockAdapter extends ListsClockPort {
  now(): Date {
    return new Date();
  }
}
