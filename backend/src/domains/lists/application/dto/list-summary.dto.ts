export class ListSummaryDto {
  constructor(
    public readonly id: string,
    public readonly ownerUserId: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
