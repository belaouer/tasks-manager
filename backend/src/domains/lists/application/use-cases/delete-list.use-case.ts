import { Injectable } from '@nestjs/common';
import { DeleteListCommand } from '../dto/delete-list.command';
import { ListAccessDeniedApplicationException } from '../exceptions/list-access-denied.application-exception';
import { ListNotFoundApplicationException } from '../exceptions/list-not-found.application-exception';
import { ListsRepositoryPort } from '../../domain/ports/lists-repository.port';
import { ListId } from '../../domain/value-objects/list-id.value-object';
import { OwnerUserId } from '../../domain/value-objects/owner-user-id.value-object';

@Injectable()
export class DeleteListUseCase {
  constructor(private readonly listsRepository: ListsRepositoryPort) {}

  async execute(command: DeleteListCommand): Promise<void> {
    const listId = ListId.create(command.listId);
    const ownerUserId = OwnerUserId.create(command.ownerUserId);

    const taskList = await this.listsRepository.findById(listId);
    if (taskList === null) {
      throw new ListNotFoundApplicationException();
    }

    if (taskList.getOwnerUserId().getValue() !== ownerUserId.getValue()) {
      throw new ListAccessDeniedApplicationException();
    }

    await this.listsRepository.deleteById(listId);
  }
}
