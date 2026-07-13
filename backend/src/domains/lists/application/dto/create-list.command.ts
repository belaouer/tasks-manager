export class CreateListCommand {
  constructor(
    public readonly ownerUserId: string,
    public readonly name: string,
  ) {}
}
