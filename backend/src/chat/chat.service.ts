import { Injectable } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';
import { EnvironmentsService } from '../environments/environments.service';
import { DataverseService } from '../dataverse/dataverse.service';
import { GeminiService } from '../gemini/gemini.service';
import { AuthService } from '../auth/auth.service';
import { SendMessageDto, ChatResponseDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
    constructor(
        private conversationsService: ConversationsService,
        private environmentsService: EnvironmentsService,
        private dataverseService: DataverseService,
        private geminiService: GeminiService,
        private authService: AuthService,
    ) { }

    async sendMessage(
        userId: string,
        sendMessageDto: SendMessageDto,
    ): Promise<ChatResponseDto> {
        const { conversationId, environmentId, message } = sendMessageDto;

        // Get user's Gemini API key if they have one configured
        const useFreeTier = await this.authService.shouldUseFreeTier(userId);
        let userApiKey: string | undefined;
        if (!useFreeTier) {
            userApiKey = (await this.authService.getGeminiApiKey(userId)) || undefined;
        }

        // Get environment
        const environment = await this.environmentsService.getEnvironmentEntity(
            environmentId,
            userId,
        );

        // Create or get conversation
        let convId = conversationId;
        let isNewConversation = false;

        if (!convId) {
            const newConversation = await this.conversationsService.create(userId, {
                environmentId,
                title: 'New Conversation',
            });
            convId = newConversation.id;
            isNewConversation = true;
        }

        // Save user message
        await this.conversationsService.addMessage(convId, 'user', message);

        // Authenticate with D365
        const accessToken = await this.dataverseService.authenticate(environment);

        // Fetch relevant metadata
        const metadataResult = await this.dataverseService.fetchMetadata(
            accessToken,
            environment.organizationUrl,
            message,
        );

        // Log for debugging
        console.log('Metadata summary:', metadataResult.summary);
        console.log('Entities found:', metadataResult.entities.length);
        if (metadataResult.entities.length > 0 && metadataResult.entities[0].Attributes) {
            console.log('First entity attributes count:', metadataResult.entities[0].Attributes.length);
        }
        if (metadataResult.forms) console.log('Forms found:', metadataResult.forms.length);
        if (metadataResult.views) console.log('Views found:', metadataResult.views.length);
        if (metadataResult.workflows) console.log('Workflows found:', metadataResult.workflows.length);

        // Format metadata for Gemini - include all available data
        const fullMetadata: any = {
            entities: metadataResult.entities,
        };
        if (metadataResult.forms) fullMetadata.forms = metadataResult.forms;
        if (metadataResult.views) fullMetadata.views = metadataResult.views;
        if (metadataResult.workflows) fullMetadata.workflows = metadataResult.workflows;

        const metadataText = JSON.stringify(fullMetadata, null, 2);

        // Get AI response (pass user's API key if available)
        const aiResponse = await this.geminiService.analyze(metadataText, message, userApiKey);

        // Save AI message
        await this.conversationsService.addMessage(
            convId,
            'assistant',
            aiResponse,
            {
                entitiesCount: metadataResult.entities.length,
                environmentId,
            },
        );

        // Generate title for new conversations
        if (isNewConversation) {
            const title = await this.geminiService.generateTitle(message, userApiKey);
            await this.conversationsService.updateTitle(convId, userId, title);
        }

        return {
            conversationId: convId,
            message: {
                role: 'assistant',
                content: aiResponse,
            },
        };
    }
}
