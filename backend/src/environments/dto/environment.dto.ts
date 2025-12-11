import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateEnvironmentDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsUrl({ require_tld: false })
    @IsNotEmpty()
    organizationUrl: string;

    @IsString()
    @IsNotEmpty()
    clientId: string;

    @IsString()
    @IsNotEmpty()
    clientSecret: string;

    @IsString()
    @IsNotEmpty()
    tenantId: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateEnvironmentDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsUrl()
    organizationUrl?: string;

    @IsOptional()
    @IsString()
    clientId?: string;

    @IsOptional()
    @IsString()
    clientSecret?: string;

    @IsOptional()
    @IsString()
    tenantId?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class EnvironmentResponseDto {
    id: string;
    name: string;
    organizationUrl: string;
    clientId: string;
    tenantId: string;
    description: string;
    status: string;
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
