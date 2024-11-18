import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseGuards,UseInterceptors } from '@nestjs/common';
import { UserDocsService } from './user-docs.service';
import { CreateUserDocDto } from './dto/create-user-doc.dto';
import { ApiBasicAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDoc } from './entity/user-doc.entity';
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express,Response } from 'express';

@Controller('user-docs')
export class UserDocsController {
  constructor(private readonly userDocsService: UserDocsService) {}


  @UseInterceptors(FileInterceptor('file'))
  @Post()
  @ApiOperation({ summary: 'Create a new user document' })
  @ApiConsumes('multipart/form-data')
  async create(@UploadedFile() vcfile: Express.Multer.File,@Body() createUserDocDto: CreateUserDocDto,@Res() res: Response){
    let uploadedDoc = await this.userDocsService.create(createUserDocDto,vcfile)
    return res.status(uploadedDoc.statusCode).json({ ...uploadedDoc });
  }

  @Get('/fetch/:ssoid')
  //@UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Fetch all user documents by sso_id' })
  @ApiBasicAuth("access-token")
  async fetch(@Param("ssoid") ssoId: string,): Promise<UserDoc[]> {
    return this.userDocsService.fetchBySsoId(ssoId);
  }
}