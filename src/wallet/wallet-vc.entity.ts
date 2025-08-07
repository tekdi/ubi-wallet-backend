import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wallet_vcs')
export class WalletVC {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vc_public_id', type: 'varchar', length: 255 })
  vcPublicId: string;

  @Column({ name: 'vc_json', type: 'text', nullable: true })
  vcJson: string;

  @Column({ type: 'varchar', length: 100 })
  provider: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({
    name: 'created_by',
    type: 'uuid',
    nullable: true,
  })
  createdBy: string;

  @Column({
    name: 'updated_by',
    type: 'uuid',
    nullable: true,
  })
  updatedBy: string;
}
