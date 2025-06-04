import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Prompt } from './prompt.entity';

@Entity('prompt_translations')
@Index(['promptId', 'languageCode'], { unique: true })
export class PromptTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  promptId: string;

  @ManyToOne(() => Prompt, (prompt) => prompt.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'promptId' })
  prompt: Prompt;

  @Column({ length: 5 })
  languageCode: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}