import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UploadedFile, UseGuards,UseInterceptors } from '@nestjs/common';
import { UserDocsService } from './user-docs.service';
import { CreateUserDocDto } from './dto/create-user-doc.dto';
import { ApiBasicAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDoc } from './entity/user-doc.entity';
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express,Response } from 'express';
import { AuthenticatedRequest } from '../../types/authenticated-request.interface';

@Controller('user-docs')
export class UserDocsController {
  constructor(private readonly userDocsService: UserDocsService) {}


  @UseInterceptors(FileInterceptor('file'))
  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a new user document' })
  @ApiConsumes('multipart/form-data')
  async create(@Req() req: AuthenticatedRequest,@UploadedFile() vcfile: Express.Multer.File,@Body() createUserDocDto: CreateUserDocDto,@Res() res: Response){
    const user = req?.user;
    if (!user) {
      throw new UnauthorizedException('User is not authenticated');
    }
    const ssoId = user.keycloak_id;

    let uploadedDoc = await this.userDocsService.create(createUserDocDto,vcfile,ssoId)
    return res.status(uploadedDoc.statusCode).json({ ...uploadedDoc });
  }

  @Get('/fetch')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Fetch all user documents by sso_id' })
  @ApiBasicAuth('access-token')
  async fetch(@Req() req: AuthenticatedRequest): Promise<UserDoc[]> {
    const user = req?.user;
    if (!user) {
      throw new UnauthorizedException('User is not authenticated');
    }
    const ssoId = user.keycloak_id; 

    return this.userDocsService.fetchBySsoId(ssoId);
  }
}