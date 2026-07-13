import { Injectable } from '@nestjs/common';
import { UsersClockPort } from '../../domain/ports/users-clock.port';

@Injectable()
export class UsersSystemClockAdapter extends UsersClockPort {
  now(): Date {
    return new Date();
  }
}
