import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Environment } from '../environments/environment.entity';

@Entity('saved_queries')
export class SavedQuery {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    environmentId: string;

    @ManyToOne(() => Environment, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'environmentId' })
    environment: Environment;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column('jsonb')
    definition: {
        primaryEntity: string;
        primaryEntityAlias?: string;
        fields: {
            entityAlias: string;
            fieldName: string;
            displayName?: string;
            aggregation?: string;
        }[];
        joins?: {
            fromEntityAlias: string;
            fromField: string;
            toEntity: string;
            toEntityAlias: string;
            toField: string;
            joinType?: string;
        }[];
        filters?: {
            entityAlias: string;
            fieldName: string;
            operator: string;
            value?: any;
            logicalOperator?: string;
        }[];
        orderBy?: {
            entityAlias: string;
            fieldName: string;
            direction?: string;
        }[];
        top?: number;
    };

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
