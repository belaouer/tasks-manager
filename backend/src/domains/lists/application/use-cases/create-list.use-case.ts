import { Injectable } from '@nestjs/common';
import { ListSummaryDto } from '../dto/list-summary.dto';
import { CreateListCommand } from '../dto/create-list.command';
import { ListNameAlreadyExistsApplicationException } from '../exceptions/list-name-already-exists.application-exception';
import { TaskList } from '../../domain/entities/task-list.entity';
import { ListsClockPort } from '../../domain/ports/lists-clock.port';
import { ListsIdGeneratorPort } from '../../domain/ports/lists-id-generator.port';
import { ListsRepositoryPort } from '../../domain/ports/lists-repository.port';
import { ListId } from '../../domain/value-objects/list-id.value-object';
import { ListName } from '../../domain/value-objects/list-name.value-object';
import { OwnerUserId } from '../../domain/value-objects/owner-user-id.value-object';

@Injectable()
export class CreateListUseCase {
  constructor(
    private readonly listsRepository: ListsRepositoryPort,
    private readonly listsClock: ListsClockPort,
    private readonly listsIdGenerator: ListsIdGeneratorPort,
  ) {}

  async execute(command: CreateListCommand): Promise<ListSummaryDto> {
    const ownerUserId = OwnerUserId.create(command.ownerUserId);
    const name = ListName.create(command.name);

    const existingList = await this.listsRepository.findByOwnerUserIdAndName(
      ownerUserId,
      name,
    );

    if (existingList !== null) {
      throw new ListNameAlreadyExistsApplicationException();
    }

    const taskList = TaskList.createNew({
      id: ListId.create(this.listsIdGenerator.generate()),
      ownerUserId,
      name,
      now: this.listsClock.now(),
    });

    await this.listsRepository.save(taskList);

    return new ListSummaryDto(
      taskList.getId().getValue(),
      taskList.getOwnerUserId().getValue(),
      taskList.getName().getValue(),
      taskList.getCreatedAt(),
      taskList.getUpdatedAt(),
    );
  }
}
