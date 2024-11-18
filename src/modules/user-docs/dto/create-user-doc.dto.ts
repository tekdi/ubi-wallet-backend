// src/modules/user-docs/dto/create-user-doc.dto.ts
import { IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateUserDocDto {
  @IsUUID()
  sso_id: string;

  @IsOptional()
  @IsString()
  doc_id?: string;

  @IsString()
  doc_type: string;

  @IsOptional()
  @IsString()
  doc_subtype?: string;

  @IsOptional()
  @IsString()
  issuer?: string;

  @IsOptional()
  @IsString()
  doc_data?: string;

  @IsOptional()
  @IsString()
  file?: string;

  // @IsDateString()  // Ensure that uploaded_at is a valid date string
  // uploaded_at: string;
}
