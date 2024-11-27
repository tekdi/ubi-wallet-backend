import { Module } from '@nestjs/common';
import { User } from './entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './users.controller';
import { UserService } from './users.service';

@Module({
    imports:[TypeOrmModule.forFeature([User])],
    providers: [UserService],
    controllers: [UserController]
  })
export class UsersModule {}
