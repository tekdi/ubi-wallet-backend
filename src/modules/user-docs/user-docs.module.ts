import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDocsService } from './user-docs.service';
import { UserDocsController } from './user-docs.controller';
import { UserDoc } from './entity/user-doc.entity';

@Module({
  imports:[TypeOrmModule.forFeature([UserDoc])],
  providers: [UserDocsService],
  controllers: [UserDocsController]
})
export class UserDocsModule {}
