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
        const { conversationId, environmentIds, message } = sendMessageDto;

        // Get user's Gemini API key if they have one configured
        const useFreeTier = await this.authService.shouldUseFreeTier(userId);
        let userApiKey: string | undefined;
        if (!useFreeTier) {
            userApiKey = (await this.authService.getGeminiApiKey(userId)) || undefined;
        }

        // Get all environments
        const environments = await Promise.all(
            environmentIds.map(envId => 
                this.environmentsService.getEnvironmentEntity(envId, userId)
            )
        );

        // Use first environment ID for conversation association
        const primaryEnvironmentId = environmentIds[0];

        // Create or get conversation
        let convId = conversationId;
        let isNewConversation = false;

        if (!convId) {
            const newConversation = await this.conversationsService.create(userId, {
                environmentId: primaryEnvironmentId,
                title: 'New Conversation',
            });
            convId = newConversation.id;
            isNewConversation = true;
        }

        // Save user message
        await this.conversationsService.addMessage(convId, 'user', message);

        // Fetch metadata from all environments
        const allMetadata: any[] = [];
        const environmentSummaries: string[] = [];

        for (const environment of environments) {
            try {
                // Authenticate with D365
                const accessToken = await this.dataverseService.authenticate(environment);

                // Fetch relevant metadata
                const metadataResult = await this.dataverseService.fetchMetadata(
                    accessToken,
                    environment.organizationUrl,
                    message,
                    environment,
                );

                // Build environment metadata object
                const envMetadata: any = {
                    environmentName: environment.name,
                    environmentUrl: environment.organizationUrl,
                    entities: metadataResult.entities,
                };
                if (metadataResult.forms) envMetadata.forms = metadataResult.forms;
                if (metadataResult.views) envMetadata.views = metadataResult.views;
                if (metadataResult.workflows) envMetadata.workflows = metadataResult.workflows;

                allMetadata.push(envMetadata);
                environmentSummaries.push(`${environment.name}: ${metadataResult.summary}`);

                // Log for debugging
                console.log(`[${environment.name}] Metadata summary:`, metadataResult.summary);
                console.log(`[${environment.name}] Entities found:`, metadataResult.entities.length);
            } catch (error) {
                console.error(`Error fetching metadata from ${environment.name}:`, error);
                allMetadata.push({
                    environmentName: environment.name,
                    environmentUrl: environment.organizationUrl,
                    error: `Could not fetch metadata: ${error.message}`,
                });
                environmentSummaries.push(`${environment.name}: Error - ${error.message}`);
            }
        }

        // Format metadata for Gemini
        const isComparison = environments.length > 1;
        let metadataText: string;
        let systemContext: string;

        if (isComparison) {
            // Multi-environment comparison mode
            systemContext = `You are analyzing and comparing metadata from ${environments.length} Dynamics 365/Dataverse environments. 
The user wants to compare these environments: ${environments.map(e => e.name).join(', ')}.
Please highlight differences, similarities, and any important observations between the environments.
Format your response in a clear, comparative way using tables when appropriate.`;
            
            metadataText = JSON.stringify({
                comparisonMode: true,
                environments: allMetadata,
            }, null, 2);
        } else {
            // Single environment mode
            systemContext = '';
            metadataText = JSON.stringify(allMetadata[0], null, 2);
        }

        // Get AI response
        const aiResponse = await this.geminiService.analyze(
            metadataText, 
            isComparison ? `${systemContext}\n\nUser question: ${message}` : message,
            userApiKey
        );

        // Save AI message
        await this.conversationsService.addMessage(
            convId,
            'assistant',
            aiResponse,
            {
                entitiesCount: allMetadata.reduce((acc, env) => acc + (env.entities?.length || 0), 0),
                environmentIds: environmentIds,
                comparisonMode: isComparison,
            },
        );

        // Generate title for new conversations
        if (isNewConversation) {
            const titleContext = isComparison 
                ? `Comparing ${environments.map(e => e.name).join(' vs ')}: ${message}`
                : message;
            const title = await this.geminiService.generateTitle(titleContext, userApiKey);
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
