import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { UserDocsModule } from './modules/user-docs/user-docs.module';
import { UsersModule } from './modules/users/users.module';
import { OtpModule } from './modules/otp/otp.module';
import { EncryptionService } from './common/helper/encryptionService';
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
    UsersModule,
    OtpModule,
  ],
  controllers: [AppController],
  providers: [AppService,EncryptionService],
})
export class AppModule {}
