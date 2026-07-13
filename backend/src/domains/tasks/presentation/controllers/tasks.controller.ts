import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { CompleteTaskCommand } from '../../application/dto/complete-task.command';
import { CreateTaskCommand } from '../../application/dto/create-task.command';
import { DeleteTaskCommand } from '../../application/dto/delete-task.command';
import { GetListTasksCommand } from '../../application/dto/get-list-tasks.command';
import { ReopenTaskCommand } from '../../application/dto/reopen-task.command';
import { CompleteTaskUseCase } from '../../application/use-cases/complete-task.use-case';
import { CreateTaskUseCase } from '../../application/use-cases/create-task.use-case';
import { DeleteTaskUseCase } from '../../application/use-cases/delete-task.use-case';
import { GetListTasksUseCase } from '../../application/use-cases/get-list-tasks.use-case';
import { ReopenTaskUseCase } from '../../application/use-cases/reopen-task.use-case';
import { CreateTaskRequestDto } from '../dto/create-task.request.dto';
import { TaskSummaryResponseDto } from '../dto/task-summary.response.dto';
import { TasksExceptionFilter } from '../filters/tasks-exception.filter';
import { TasksJwtAuthGuard } from '../guards/tasks-jwt-auth.guard';

interface TasksControllerRequest {
  readonly user?: {
    readonly sub: string;
    readonly email: string;
  };
}

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@UseGuards(TasksJwtAuthGuard)
@UseFilters(TasksExceptionFilter)
@Controller('lists/:listId/tasks')
export class TasksController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly getListTasksUseCase: GetListTasksUseCase,
    private readonly completeTaskUseCase: CompleteTaskUseCase,
    private readonly reopenTaskUseCase: ReopenTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a task for authenticated user in list.' })
  @ApiParam({ name: 'listId', description: 'List identifier.' })
  @ApiCreatedResponse({ type: TaskSummaryResponseDto })
  @ApiResponse({ status: 400, description: 'Validation or domain error.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  async createTask(
    @Req() request: TasksControllerRequest,
    @Param('listId') listId: string,
    @Body() body: CreateTaskRequestDto,
  ): Promise<TaskSummaryResponseDto> {
    const ownerUserId = request.user?.sub;

    if (!ownerUserId) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    const created = await this.createTaskUseCase.execute(
      new CreateTaskCommand(
        ownerUserId,
        listId,
        body.shortDescription,
        body.longDescription ?? null,
        new Date(body.dueDate),
      ),
    );

    return new TaskSummaryResponseDto(created);
  }

  @Get()
  @ApiOperation({ summary: 'Get authenticated user tasks for list.' })
  @ApiParam({ name: 'listId', description: 'List identifier.' })
  @ApiOkResponse({ type: TaskSummaryResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  async getListTasks(
    @Req() request: TasksControllerRequest,
    @Param('listId') listId: string,
  ): Promise<TaskSummaryResponseDto[]> {
    const ownerUserId = request.user?.sub;

    if (!ownerUserId) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    const tasks = await this.getListTasksUseCase.execute(
      new GetListTasksCommand(ownerUserId, listId),
    );

    return tasks.map((task) => new TaskSummaryResponseDto(task));
  }

  @Patch(':taskId/complete')
  @ApiOperation({ summary: 'Mark a task as completed.' })
  @ApiParam({ name: 'listId', description: 'List identifier.' })
  @ApiParam({ name: 'taskId', description: 'Task identifier.' })
  @ApiOkResponse({ type: TaskSummaryResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid identifiers.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  @ApiResponse({ status: 403, description: 'Task does not belong to user/list.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async completeTask(
    @Req() request: TasksControllerRequest,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
  ): Promise<TaskSummaryResponseDto> {
    const ownerUserId = request.user?.sub;

    if (!ownerUserId) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    const task = await this.completeTaskUseCase.execute(
      new CompleteTaskCommand(ownerUserId, listId, taskId),
    );

    return new TaskSummaryResponseDto(task);
  }

  @Patch(':taskId/reopen')
  @ApiOperation({ summary: 'Reopen a completed task.' })
  @ApiParam({ name: 'listId', description: 'List identifier.' })
  @ApiParam({ name: 'taskId', description: 'Task identifier.' })
  @ApiOkResponse({ type: TaskSummaryResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid identifiers.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  @ApiResponse({ status: 403, description: 'Task does not belong to user/list.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async reopenTask(
    @Req() request: TasksControllerRequest,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
  ): Promise<TaskSummaryResponseDto> {
    const ownerUserId = request.user?.sub;

    if (!ownerUserId) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    const task = await this.reopenTaskUseCase.execute(
      new ReopenTaskCommand(ownerUserId, listId, taskId),
    );

    return new TaskSummaryResponseDto(task);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task.' })
  @ApiParam({ name: 'listId', description: 'List identifier.' })
  @ApiParam({ name: 'taskId', description: 'Task identifier.' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid identifiers.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  @ApiResponse({ status: 403, description: 'Task does not belong to user/list.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async deleteTask(
    @Req() request: TasksControllerRequest,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
  ): Promise<void> {
    const ownerUserId = request.user?.sub;

    if (!ownerUserId) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    await this.deleteTaskUseCase.execute(
      new DeleteTaskCommand(ownerUserId, listId, taskId),
    );
  }
}
