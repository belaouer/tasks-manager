export class ReopenTaskCommand {
  constructor(
    public readonly ownerUserId: string,
    public readonly listId: string,
    public readonly taskId: string,
  ) {}
}
