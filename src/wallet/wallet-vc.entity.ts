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

  @Column({ type: 'varchar', length: 100 })
  provider: string;

  @Column({ name: 'watcher_registered', type: 'boolean', default: false })
  watcherRegistered: boolean;

  @Column({
    name: 'watcher_email',
    type: 'varchar',
    length: 500,
    default: null,
  })
  watcherEmail: string;

  @Column({
    name: 'watcher_callback_url',
    type: 'varchar',
    length: 500,
    default: null,
  })
  watcherCallbackUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({
    name: 'created_by',
    type: 'varchar',
    length: 255,
    default: null,
  })
  createdBy: string;

  @Column({
    name: 'updated_by',
    type: 'varchar',
    length: 255,
    default: null,
  })
  updatedBy: string;
}
