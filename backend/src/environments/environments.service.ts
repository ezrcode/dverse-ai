import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Environment } from './environment.entity';
import {
    CreateEnvironmentDto,
    UpdateEnvironmentDto,
    EnvironmentResponseDto,
} from './dto/environment.dto';
import { EncryptionService } from '../common/encryption.service';
import { DataverseService } from '../dataverse/dataverse.service';

@Injectable()
export class EnvironmentsService {
    constructor(
        @InjectRepository(Environment)
        private environmentRepository: Repository<Environment>,
        private encryptionService: EncryptionService,
        private dataverseService: DataverseService,
    ) { }

    async create(
        userId: string,
        createEnvironmentDto: CreateEnvironmentDto,
    ): Promise<EnvironmentResponseDto> {
        // Check if environment with same name exists for this user
        const existing = await this.environmentRepository.findOne({
            where: { userId, name: createEnvironmentDto.name },
        });

        if (existing) {
            throw new HttpException(
                'Environment with this name already exists',
                HttpStatus.CONFLICT,
            );
        }

        // Encrypt client secret
        const encryptedSecret = this.encryptionService.encrypt(
            createEnvironmentDto.clientSecret,
        );

        const environment = this.environmentRepository.create({
            ...createEnvironmentDto,
            userId,
            clientSecret: encryptedSecret,
            status: 'disconnected',
        });

        const saved = await this.environmentRepository.save(environment);

        return this.toResponseDto(saved);
    }

    async findAll(userId: string): Promise<EnvironmentResponseDto[]> {
        const environments = await this.environmentRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });

        return environments.map((env) => this.toResponseDto(env));
    }

    async findOne(id: string, userId: string): Promise<EnvironmentResponseDto> {
        const environment = await this.environmentRepository.findOne({
            where: { id, userId },
        });

        if (!environment) {
            throw new HttpException('Environment not found', HttpStatus.NOT_FOUND);
        }

        return this.toResponseDto(environment);
    }

    async update(
        id: string,
        userId: string,
        updateEnvironmentDto: UpdateEnvironmentDto,
    ): Promise<EnvironmentResponseDto> {
        const environment = await this.environmentRepository.findOne({
            where: { id, userId },
        });

        if (!environment) {
            throw new HttpException('Environment not found', HttpStatus.NOT_FOUND);
        }

        // If client secret is being updated, encrypt it
        if (updateEnvironmentDto.clientSecret) {
            updateEnvironmentDto.clientSecret = this.encryptionService.encrypt(
                updateEnvironmentDto.clientSecret,
            );
        }

        // Merge updates
        Object.assign(environment, updateEnvironmentDto);

        const updated = await this.environmentRepository.save(environment);

        return this.toResponseDto(updated);
    }

    async remove(id: string, userId: string): Promise<void> {
        const environment = await this.environmentRepository.findOne({
            where: { id, userId },
        });

        if (!environment) {
            throw new HttpException('Environment not found', HttpStatus.NOT_FOUND);
        }

        await this.environmentRepository.remove(environment);
    }

    async testConnection(
        id: string,
        userId: string,
    ): Promise<{ success: boolean; message: string }> {
        const environment = await this.environmentRepository.findOne({
            where: { id, userId },
        });

        if (!environment) {
            throw new HttpException('Environment not found', HttpStatus.NOT_FOUND);
        }

        try {
            const isConnected = await this.dataverseService.testConnection(
                environment,
            );

            if (isConnected) {
                environment.status = 'connected';
                environment.lastSyncAt = new Date();
                await this.environmentRepository.save(environment);

                return {
                    success: true,
                    message: 'Successfully connected to Dynamics 365',
                };
            } else {
                environment.status = 'error';
                await this.environmentRepository.save(environment);

                return {
                    success: false,
                    message: 'Failed to connect to Dynamics 365',
                };
            }
        } catch (error) {
            environment.status = 'error';
            await this.environmentRepository.save(environment);

            return {
                success: false,
                message: error.message || 'Connection test failed',
            };
        }
    }

    async getEnvironmentEntity(
        id: string,
        userId: string,
    ): Promise<Environment> {
        const environment = await this.environmentRepository.findOne({
            where: { id, userId },
        });

        if (!environment) {
            throw new HttpException('Environment not found', HttpStatus.NOT_FOUND);
        }

        return environment;
    }

    /**
     * Get all environment entities (with secrets) for a user
     * Used for report generation
     */
    async findAllEntities(userId: string): Promise<Environment[]> {
        return this.environmentRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    private toResponseDto(environment: Environment): EnvironmentResponseDto {
        return {
            id: environment.id,
            name: environment.name,
            organizationUrl: environment.organizationUrl,
            clientId: environment.clientId,
            tenantId: environment.tenantId,
            description: environment.description,
            status: environment.status,
            lastSyncAt: environment.lastSyncAt,
            createdAt: environment.createdAt,
            updatedAt: environment.updatedAt,
        };
    }
}
