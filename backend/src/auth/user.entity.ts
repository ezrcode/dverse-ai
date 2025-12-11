import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Environment } from '../environments/environment.entity';
import { Conversation } from '../conversations/conversation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ name: 'gemini_api_key', type: 'varchar', nullable: true })
  geminiApiKey: string | null; // Encrypted API key

  @Column({ name: 'use_free_tier', default: true })
  useFreeTier: boolean;

  @Column({ name: 'profile_photo_url', type: 'varchar', nullable: true })
  profilePhotoUrl: string | null;

  @Column({ name: 'language', type: 'varchar', default: 'es' })
  language: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Environment, (environment) => environment.user)
  environments: Environment[];

  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations: Conversation[];
}
