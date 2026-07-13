export class TaskSummaryDto {
  constructor(
    public readonly id: string,
    public readonly listId: string,
    public readonly ownerUserId: string,
    public readonly shortDescription: string,
    public readonly longDescription: string | null,
    public readonly dueDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly completedAt: Date | null,
    public readonly completed: boolean,
  ) {}
}
