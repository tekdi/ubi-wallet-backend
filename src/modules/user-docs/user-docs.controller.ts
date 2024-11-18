import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserDocsService } from './user-docs.service';
import { CreateUserDocDto } from './dto/create-user-doc.dto';
import { ApiBasicAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDoc } from './entity/user-doc.entity';
import { AuthGuard } from '../auth/auth.guard';

@Controller('user-docs')
export class UserDocsController {
  constructor(private readonly userDocsService: UserDocsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user document' })
  // @ApiResponse({ status: 201, description: 'The document has been created.', type: UserDoc })
  // @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createUserDocDto: CreateUserDocDto){
    return this.userDocsService.create(createUserDocDto);
  }

  @Get('/fetch/:userid')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Fetch all user documents by user_id' })
  @ApiBasicAuth("access-token")
  async fetch(@Param("userid") userId: string,): Promise<UserDoc[]> {
    return this.userDocsService.fetchByUserId(userId);
  }
}