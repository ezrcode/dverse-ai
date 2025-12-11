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
import { Conversation } from '../conversations/conversation.entity';

@Entity('environments')
export class Environment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column()
    name: string;

    @Column({ name: 'organization_url' })
    organizationUrl: string;

    @Column({ name: 'client_id' })
    clientId: string;

    @Column({ name: 'client_secret' })
    clientSecret: string; // Will be encrypted

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: 'disconnected' })
    status: string; // connected/disconnected/error

    @Column({ name: 'last_sync_at', nullable: true })
    lastSyncAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.environments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => Conversation, (conversation) => conversation.environment)
    conversations: Conversation[];
}
