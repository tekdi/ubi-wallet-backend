import { IsString, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class OnboardUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  externalUserId: string;
}
