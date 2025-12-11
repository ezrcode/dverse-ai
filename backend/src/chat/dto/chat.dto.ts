import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class SendMessageDto {
    @IsOptional()
    @IsUUID()
    conversationId?: string;

    @IsUUID()
    @IsNotEmpty()
    environmentId: string;

    @IsString()
    @IsNotEmpty()
    message: string;
}

export class ChatResponseDto {
    conversationId: string;
    message: {
        role: string;
        content: string;
    };
}
