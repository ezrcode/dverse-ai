import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ConversationsModule } from '../conversations/conversations.module';
import { EnvironmentsModule } from '../environments/environments.module';
import { AuthModule } from '../auth/auth.module';
import { DataverseService } from '../dataverse/dataverse.service';
import { GeminiService } from '../gemini/gemini.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
    imports: [ConversationsModule, EnvironmentsModule, AuthModule],
    controllers: [ChatController],
    providers: [ChatService, DataverseService, GeminiService, EncryptionService],
})
export class ChatModule { }
