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
import { PromptTranslation } from './prompt-translation.entity';

export enum PromptType {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('prompts')
export class Prompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  category: string;

  @Column({
    type: 'enum',
    enum: PromptType,
    default: PromptType.SYSTEM,
  })
  promptType: PromptType;

  @Column({ default: 'en' })
  defaultLanguage: string;

  @Column('simple-array', { nullable: true })
  variables: string[];

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => PromptTranslation, (translation) => translation.prompt, {
    cascade: true,
    eager: true,
  })
  translations: PromptTranslation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}