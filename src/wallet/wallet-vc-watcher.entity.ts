import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wallet_vc_watchers')
export class WalletVCWatcher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vc_public_id', type: 'varchar', length: 255 })
  vcPublicId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'provider', type: 'varchar', length: 100, default: null })
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

  @Column({
    name: 'forward_watcher_callback_url',
    type: 'varchar',
    length: 1500,
    default: null,
  })
  forwardWatcherCallbackUrl: string;

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
