export interface TasksPersistenceRecord {
  readonly id: string;
  readonly listId: string;
  readonly ownerUserId: string;
  readonly shortDescription: string;
  readonly longDescription: string | null;
  readonly dueDate: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly completedAt: Date | null;
}
