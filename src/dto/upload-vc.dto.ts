import { IsString, IsNotEmpty } from 'class-validator';

export class UploadVcDto {
  @IsString()
  @IsNotEmpty()
  qrData: string;
}
