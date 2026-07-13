export class DeleteListCommand {
  constructor(
    public readonly ownerUserId: string,
    public readonly listId: string,
  ) {}
}
