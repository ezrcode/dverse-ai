import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Environment } from '../environments/environment.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'environment_id', nullable: true })
    environmentId: string;

    @Column({ nullable: true })
    title: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.conversations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Environment, (environment) => environment.conversations, {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'environment_id' })
    environment: Environment;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];
}
