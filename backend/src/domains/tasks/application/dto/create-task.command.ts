export class CreateTaskCommand {
  constructor(
    public readonly ownerUserId: string,
    public readonly listId: string,
    public readonly shortDescription: string,
    public readonly longDescription: string | null,
    public readonly dueDate: Date,
  ) {}
}
