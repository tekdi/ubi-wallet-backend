// src/modules/user-docs/dto/create-user-doc.dto.ts
import { IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateUserDocDto {
  @IsUUID()
  user_id: string;

  @IsString()
  doc_id: string;

  @IsString()
  doc_type: string;

  @IsOptional()
  @IsString()
  doc_subtype?: string;

  @IsString()
  doc_name: string;

  @IsOptional()
  @IsString()
  doc_data?: string;

  // @IsDateString()  // Ensure that uploaded_at is a valid date string
  // uploaded_at: string;
}
