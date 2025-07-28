import { Module } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { UserModule } from '../users/user.module';

@Module({
  imports: [UserModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class CommonModule {} 