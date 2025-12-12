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
        const allDataResults: { envName: string; results: any[] }[] = [];
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

                // Check if the query needs actual data
                if (metadataResult.entities.length > 0) {
                    const entityInfo = metadataResult.entities.map((e: any) => ({
                        logicalName: e.LogicalName,
                        displayName: e.DisplayName,
                        attributes: (e.Attributes || []).slice(0, 50).map((a: any) => ({
                            logicalName: a.LogicalName,
                            displayName: a.DisplayName,
                            type: a.AttributeType,
                        })),
                    }));

                    const queryIntent = await this.geminiService.analyzeQueryIntent(
                        message,
                        entityInfo,
                        userApiKey,
                    );

                    console.log(`[${environment.name}] Query intent:`, queryIntent);

                    if (queryIntent.needsData && queryIntent.entities.length > 0) {
                        console.log(`[${environment.name}] Fetching actual data...`);
                        
                        const dataResults: any[] = [];
                        for (const entityQuery of queryIntent.entities) {
                            try {
                                if (entityQuery.aggregation) {
                                    // Aggregation query
                                    const aggResult = await this.dataverseService.aggregateQuery(
                                        accessToken,
                                        environment.organizationUrl,
                                        entityQuery.entityName,
                                        {
                                            groupBy: entityQuery.groupBy,
                                            aggregate: [entityQuery.aggregation],
                                            filter: entityQuery.filter,
                                        },
                                    );
                                    dataResults.push({
                                        entityName: entityQuery.entityName,
                                        records: aggResult.results,
                                        totalCount: aggResult.results.length,
                                        query: `Aggregation: ${entityQuery.aggregation.operation}(${entityQuery.aggregation.field})`,
                                        error: aggResult.error,
                                    });
                                } else {
                                    // Regular data query
                                    const result = await this.dataverseService.fetchDataFromQuery(
                                        accessToken,
                                        environment.organizationUrl,
                                        entityQuery.entityName,
                                        {
                                            select: entityQuery.select,
                                            filter: entityQuery.filter,
                                            orderby: entityQuery.orderby,
                                            top: entityQuery.top || 50,
                                        },
                                    );
                                    dataResults.push(result);
                                }
                            } catch (dataError) {
                                console.error(`Error fetching data for ${entityQuery.entityName}:`, dataError);
                                dataResults.push({
                                    entityName: entityQuery.entityName,
                                    records: [],
                                    query: '',
                                    error: dataError.message,
                                });
                            }
                        }
                        
                        if (dataResults.length > 0) {
                            allDataResults.push({ envName: environment.name, results: dataResults });
                            envMetadata.dataFetched = true;
                            envMetadata.dataQueryExplanation = queryIntent.explanation;
                        }
                    }
                }

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

        // Get AI response - use data-aware analysis if we have data
        let aiResponse: string;
        
        if (allDataResults.length > 0) {
            // We have actual data, use the data-aware analysis
            const flatDataResults = allDataResults.flatMap(dr => 
                dr.results.map(r => ({ ...r, environmentName: dr.envName }))
            );
            
            aiResponse = await this.geminiService.analyzeWithData(
                metadataText,
                flatDataResults,
                isComparison ? `${systemContext}\n\nUser question: ${message}` : message,
                userApiKey,
            );
        } else {
            // Metadata-only analysis
            aiResponse = await this.geminiService.analyze(
                metadataText, 
                isComparison ? `${systemContext}\n\nUser question: ${message}` : message,
                userApiKey
            );
        }

        // Save AI message
        await this.conversationsService.addMessage(
            convId,
            'assistant',
            aiResponse,
            {
                entitiesCount: allMetadata.reduce((acc, env) => acc + (env.entities?.length || 0), 0),
                environmentIds: environmentIds,
                comparisonMode: isComparison,
                dataFetched: allDataResults.length > 0,
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
