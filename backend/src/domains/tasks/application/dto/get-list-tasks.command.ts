export class GetListTasksCommand {
  constructor(
    public readonly ownerUserId: string,
    public readonly listId: string,
  ) {}
}
