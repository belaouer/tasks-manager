import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 'task_lists' })
@Unique('uq_task_lists_owner_name', ['ownerUserId', 'name'])
export class TypeOrmTaskListEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  ownerUserId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'timestamp' })
  updatedAt!: Date;
}
