import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { UserDocsModule } from './modules/user-docs/user-docs.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    {
      ...HttpModule.register({}),
      global: true,
    },
    UserDocsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
