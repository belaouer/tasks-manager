import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserCommand } from '../../application/dto/create-user.command';
import { GetUserProfileCommand } from '../../application/dto/get-user-profile.command';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { GetUserProfileUseCase } from '../../application/use-cases/get-user-profile.use-case';
import { CreateUserRequestDto } from '../dto/create-user.request.dto';
import { UserProfileResponseDto } from '../dto/user-profile.response.dto';
import { UsersExceptionFilter } from '../filters/users-exception.filter';

@Controller('users')
@UseFilters(UsersExceptionFilter)
@ApiTags('Users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a user profile.' })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiCreatedResponse({ type: UserProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Validation or domain error.' })
  @ApiResponse({ status: 409, description: 'User already exists.' })
  async createUser(
    @Body() body: CreateUserRequestDto,
  ): Promise<UserProfileResponseDto> {
    const profile = await this.createUserUseCase.execute(
      new CreateUserCommand(body.email, body.firstName, body.lastName),
    );

    return new UserProfileResponseDto(profile);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile by id.' })
  @ApiParam({ name: 'id', description: 'User identifier.' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid user id.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserProfile(@Param('id') id: string): Promise<UserProfileResponseDto> {
    const profile = await this.getUserProfileUseCase.execute(
      new GetUserProfileCommand(id),
    );

    return new UserProfileResponseDto(profile);
  }
}
