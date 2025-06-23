import { IsString, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class OnboardUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  externalUserId: string;
}
