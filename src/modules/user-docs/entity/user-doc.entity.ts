import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { IsUUID, IsOptional, IsString } from 'class-validator';

@Entity('user_docs')
export class UserDoc {
  // @PrimaryGeneratedColumn()
  // id: number;

  @PrimaryColumn() //, default: () => 'public.uuid_generate_v4()' 
  @IsString()
  doc_id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  user_id: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  doc_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  doc_subtype: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  doc_name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  doc_data: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  uploaded_at: Date;
}
