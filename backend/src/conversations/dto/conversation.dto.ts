import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateConversationDto {
    @IsOptional()
    @IsUUID()
    environmentId?: string;

    @IsOptional()
    @IsString()
    title?: string;
}

export class MessageDto {
    role: string;
    content: string;
    createdAt: Date;
}

export class ConversationResponseDto {
    id: string;
    title: string;
    environmentId: string;
    environmentName?: string;
    createdAt: Date;
    updatedAt: Date;
    messages?: MessageDto[];
}

export class UpdateConversationDto {
    @IsOptional()
    @IsString()
    title?: string;
}
