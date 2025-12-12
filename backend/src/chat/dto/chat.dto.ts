import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class SendMessageDto {
    @IsOptional()
    @IsUUID()
    conversationId?: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    environmentIds: string[];

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
