import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { RegisterDto, UserResponseDto, UpdateSettingsDto, SettingsResponseDto, UpdateProfileDto } from './dto/auth.dto';
import { EncryptionService } from '../common/encryption.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private encryptionService: EncryptionService,
    ) { }

    async register(registerDto: RegisterDto): Promise<UserResponseDto> {
        const { email, password, name } = registerDto;

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = this.userRepository.create({
            email,
            passwordHash,
            name: name || null,
            language: 'es',
        });

        const savedUser = await this.userRepository.save(user);

        return {
            id: savedUser.id,
            email: savedUser.email,
            name: savedUser.name,
            profilePhotoUrl: savedUser.profilePhotoUrl,
            language: savedUser.language,
            createdAt: savedUser.createdAt,
        };
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { email } });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            return user;
        }

        return null;
    }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async getSettings(userId: string): Promise<SettingsResponseDto> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        return {
            useFreeTier: user.useFreeTier,
            hasGeminiApiKey: !!user.geminiApiKey,
        };
    }

    async updateSettings(userId: string, updateSettingsDto: UpdateSettingsDto): Promise<SettingsResponseDto> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        if (updateSettingsDto.useFreeTier !== undefined) {
            user.useFreeTier = updateSettingsDto.useFreeTier;
        }

        if (updateSettingsDto.geminiApiKey !== undefined) {
            if (updateSettingsDto.geminiApiKey === '') {
                user.geminiApiKey = null;
            } else {
                user.geminiApiKey = this.encryptionService.encrypt(updateSettingsDto.geminiApiKey);
            }
        }

        await this.userRepository.save(user);

        return {
            useFreeTier: user.useFreeTier,
            hasGeminiApiKey: !!user.geminiApiKey,
        };
    }

    async getGeminiApiKey(userId: string): Promise<string | null> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || !user.geminiApiKey) {
            return null;
        }

        return this.encryptionService.decrypt(user.geminiApiKey);
    }

    async shouldUseFreeTier(userId: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        return user?.useFreeTier ?? true;
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        if (updateProfileDto.name !== undefined) {
            user.name = updateProfileDto.name?.trim() || null;
        }

        if (updateProfileDto.profilePhotoUrl !== undefined) {
            user.profilePhotoUrl = updateProfileDto.profilePhotoUrl || null;
        }

        if (updateProfileDto.language !== undefined) {
            user.language = updateProfileDto.language;
        }

        const saved = await this.userRepository.save(user);

        return {
            id: saved.id,
            email: saved.email,
            name: saved.name,
            profilePhotoUrl: saved.profilePhotoUrl,
            language: saved.language,
            createdAt: saved.createdAt,
        };
    }
}
