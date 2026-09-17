import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import type { PromptTranslation } from './prompt-translation.entity';
import { PromptType } from '@app/shared';

@Entity('prompts')
export class Prompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  key: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'varchar' })
  category: string;

  @Column({
    type: 'enum',
    enum: PromptType,
    default: PromptType.SYSTEM,
  })
  promptType: PromptType;

  @Column({ type: 'varchar', length: 5, default: 'en' })
  defaultLanguage: string;

  @Column('simple-array', { nullable: true })
  variables: string[];

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(
    'PromptTranslation',
    (translation: PromptTranslation) => translation.prompt,
    {
      cascade: true,
      eager: true,
    },
  )
  translations: PromptTranslation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
