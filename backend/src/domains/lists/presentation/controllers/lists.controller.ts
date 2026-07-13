import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateListCommand } from '../../application/dto/create-list.command';
import { DeleteListCommand } from '../../application/dto/delete-list.command';
import { GetUserListsCommand } from '../../application/dto/get-user-lists.command';
import { CreateListUseCase } from '../../application/use-cases/create-list.use-case';
import { DeleteListUseCase } from '../../application/use-cases/delete-list.use-case';
import { GetUserListsUseCase } from '../../application/use-cases/get-user-lists.use-case';
import { CreateListRequestDto } from '../dto/create-list.request.dto';
import { ListSummaryResponseDto } from '../dto/list-summary.response.dto';
import { ListsExceptionFilter } from '../filters/lists-exception.filter';
import { ListsJwtAuthGuard } from '../guards/lists-jwt-auth.guard';

interface ListsControllerRequest {
  readonly user?: {
    readonly sub: string;
    readonly email: string;
  };
}

@ApiTags('Lists')
@ApiBearerAuth('access-token')
@UseGuards(ListsJwtAuthGuard)
@UseFilters(ListsExceptionFilter)
@Controller('lists')
export class ListsController {
  constructor(
    private readonly createListUseCase: CreateListUseCase,
    private readonly getUserListsUseCase: GetUserListsUseCase,
    private readonly deleteListUseCase: DeleteListUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a list for authenticated user.' })
  @ApiCreatedResponse({ type: ListSummaryResponseDto })
  @ApiResponse({ status: 400, description: 'Validation or domain error.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  @ApiResponse({ status: 409, description: 'List name already exists.' })
  async createList(
    @Req() request: ListsControllerRequest,
    @Body() body: CreateListRequestDto,
  ): Promise<ListSummaryResponseDto> {
    const ownerUserId = request.user?.sub;

    if (!ownerUserId) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    const created = await this.createListUseCase.execute(
      new CreateListCommand(ownerUserId, body.name),
    );

    return new ListSummaryResponseDto(created);
  }

  @Get()
  @ApiOperation({ summary: 'Get authenticated user lists.' })
  @ApiOkResponse({ type: ListSummaryResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  async getMyLists(
    @Req() request: ListsControllerRequest,
  ): Promise<ListSummaryResponseDto[]> {
    const ownerUserId = request.user?.sub;

    if (!ownerUserId) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    const lists = await this.getUserListsUseCase.execute(
      new GetUserListsCommand(ownerUserId),
    );
    return lists.map((item) => new ListSummaryResponseDto(item));
  }

  @Delete(':listId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a list owned by authenticated user.' })
  @ApiParam({ name: 'listId', description: 'List identifier.' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid list id.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  @ApiResponse({ status: 403, description: 'List does not belong to user.' })
  @ApiResponse({ status: 404, description: 'List not found.' })
  async deleteList(
    @Req() request: ListsControllerRequest,
    @Param('listId') listId: string,
  ): Promise<void> {
    const ownerUserId = request.user?.sub;

    if (!ownerUserId) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    await this.deleteListUseCase.execute(
      new DeleteListCommand(ownerUserId, listId),
    );
  }
}
