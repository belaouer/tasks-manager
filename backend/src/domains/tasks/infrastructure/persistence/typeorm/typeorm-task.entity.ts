import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'tasks' })
export class TypeOrmTaskEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  listId!: string;

  @Column({ type: 'varchar', length: 64 })
  ownerUserId!: string;

  @Column({ type: 'varchar', length: 160 })
  shortDescription!: string;

  @Column({ type: 'text', nullable: true })
  longDescription!: string | null;

  @Column({ type: 'timestamp' })
  dueDate!: Date;

  @Column({ type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'timestamp' })
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;
}
