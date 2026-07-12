import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'auth_users' })
export class TypeOrmAuthUserEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email!: string;

  @Column({ type: 'text' })
  passwordHash!: string;

  @Column({ type: 'text', nullable: true })
  refreshTokenHash!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
