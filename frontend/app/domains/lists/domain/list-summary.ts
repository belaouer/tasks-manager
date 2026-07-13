export interface ListSummary {
  readonly id: string;
  readonly ownerUserId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly pendingSync?: boolean;
}

export interface CreateListPayload {
  readonly name: string;
}
