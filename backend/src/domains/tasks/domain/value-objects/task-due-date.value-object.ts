import { InvalidTaskDueDateDomainException } from '../exceptions/invalid-task-due-date.domain-exception';

export class TaskDueDate {
  private constructor(private readonly value: Date) {}

  static create(value: Date): TaskDueDate {
    const timestamp = value.getTime();

    if (Number.isNaN(timestamp)) {
      throw new InvalidTaskDueDateDomainException();
    }

    return new TaskDueDate(new Date(timestamp));
  }

  getValue(): Date {
    return new Date(this.value.getTime());
  }
}
