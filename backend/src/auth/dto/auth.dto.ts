import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    name?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class UserResponseDto {
    id: string;
    email: string;
    name: string | null;
    profilePhotoUrl?: string | null;
    language: string;
    createdAt: Date;
}

export class UpdateSettingsDto {
    @IsOptional()
    @IsString()
    geminiApiKey?: string;

    @IsOptional()
    @IsBoolean()
    useFreeTier?: boolean;
}

export class SettingsResponseDto {
    useFreeTier: boolean;
    hasGeminiApiKey: boolean;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    profilePhotoUrl?: string;

    @IsOptional()
    @IsString()
    language?: 'es' | 'en';
}
