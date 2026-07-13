import { Injectable } from '@nestjs/common';
import { TasksClockPort } from '../../domain/ports/tasks-clock.port';

@Injectable()
export class TasksSystemClockAdapter extends TasksClockPort {
  now(): Date {
    return new Date();
  }
}
