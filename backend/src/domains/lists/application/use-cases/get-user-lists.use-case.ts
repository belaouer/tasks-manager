import { Injectable } from '@nestjs/common';
import { GetUserListsCommand } from '../dto/get-user-lists.command';
import { ListSummaryDto } from '../dto/list-summary.dto';
import { ListsRepositoryPort } from '../../domain/ports/lists-repository.port';
import { OwnerUserId } from '../../domain/value-objects/owner-user-id.value-object';

@Injectable()
export class GetUserListsUseCase {
  constructor(private readonly listsRepository: ListsRepositoryPort) {}

  async execute(command: GetUserListsCommand): Promise<ListSummaryDto[]> {
    const ownerUserId = OwnerUserId.create(command.ownerUserId);
    const lists = await this.listsRepository.findByOwnerUserId(ownerUserId);

    return lists.map(
      (taskList) =>
        new ListSummaryDto(
          taskList.getId().getValue(),
          taskList.getOwnerUserId().getValue(),
          taskList.getName().getValue(),
          taskList.getCreatedAt(),
          taskList.getUpdatedAt(),
        ),
    );
  }
}
