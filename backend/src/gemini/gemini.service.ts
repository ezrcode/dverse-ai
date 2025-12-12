import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
    private defaultApiKey: string;

    constructor(private configService: ConfigService) {
        this.defaultApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    }

    private getModel(userApiKey?: string) {
        const apiKey = userApiKey || this.defaultApiKey;
        if (!apiKey) {
            throw new HttpException(
                'No Gemini API key configured. Please add your API key in Settings or contact the administrator.',
                HttpStatus.BAD_REQUEST,
            );
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.5-flash (latest, fast and capable)
        return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    /**
     * Analyze Dataverse metadata and answer user question
     */
    async analyze(metadata: string, question: string, userApiKey?: string): Promise<string> {
        try {
            const model = this.getModel(userApiKey);
            const prompt = `You are an expert Microsoft Dynamics 365 and Dataverse analyst. You help users understand their Dataverse metadata and answer technical questions.

Dataverse Metadata:
${metadata}

User Question: ${question}

Instructions:
- Provide clear, technical answers based on the metadata provided
- If the metadata doesn't contain enough information to answer the question, say so
- Use proper Dynamics 365 terminology
- Format your response in a clear, structured way
- Include code examples or entity/field names when relevant
- Be concise but thorough

Answer:`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini Analysis Error:', error);
            throw new HttpException(
                'Failed to generate AI response. Please check your API key.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Generate a conversation title from the first user message
     */
    async generateTitle(message: string, userApiKey?: string): Promise<string> {
        try {
            const model = this.getModel(userApiKey);
            const prompt = `Generate a short, descriptive title (max 6 words) for a conversation that starts with this message:

"${message}"

Return only the title, nothing else.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let title = response.text().trim();

            // Remove quotes if present
            title = title.replace(/^["']|["']$/g, '');

            // Truncate if too long
            if (title.length > 60) {
                title = title.substring(0, 57) + '...';
            }

            return title;
        } catch (error) {
            console.error('Gemini Title Generation Error:', error);
            // Return a fallback title
            return message.substring(0, 50) + (message.length > 50 ? '...' : '');
        }
    }

    /**
     * Analyze query to determine relevant entities (for future optimization)
     */
    async extractRelevantEntities(
        query: string,
        availableEntities: string[],
        userApiKey?: string,
    ): Promise<string[]> {
        try {
            const model = this.getModel(userApiKey);
            const prompt = `Given this user query about Dynamics 365:
"${query}"

And these available entities:
${availableEntities.join(', ')}

Which entities are most relevant to answering this query? Return only the entity names as a comma-separated list, or "ALL" if you need all entities.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            if (text.toUpperCase() === 'ALL') {
                return availableEntities;
            }

            return text.split(',').map((e) => e.trim());
        } catch (error) {
            console.error('Gemini Entity Extraction Error:', error);
            // Return all entities as fallback
            return availableEntities;
        }
    }

    /**
     * Determine if the query requires actual data (not just metadata)
     */
    async analyzeQueryIntent(
        query: string,
        entityInfo: { logicalName: string; displayName: string; attributes: { logicalName: string; displayName: string; type: string }[] }[],
        userApiKey?: string,
    ): Promise<{
        needsData: boolean;
        entities: {
            entityName: string;
            select?: string[];
            filter?: string;
            orderby?: string;
            top?: number;
            aggregation?: { field: string; operation: 'sum' | 'avg' | 'min' | 'max' | 'count' };
            groupBy?: string;
        }[];
        explanation: string;
    }> {
        try {
            const model = this.getModel(userApiKey);
            
            const entityContext = entityInfo.map(e => 
                `Entity: ${e.logicalName} (${e.displayName})\nAttributes: ${e.attributes.map(a => `${a.logicalName}(${a.displayName}):${a.type}`).join(', ')}`
            ).join('\n\n');

            const prompt = `Analyze this Dynamics 365 query to determine if it requires fetching actual DATA records (not just metadata/schema).

User Query: "${query}"

Available Entities and their Attributes:
${entityContext}

IMPORTANT: Determine the intent:
1. METADATA queries (fields, forms, relationships, schema) -> needsData: false
2. DATA queries (records, counts, aggregations, specific values) -> needsData: true

If needsData is true, generate the OData query parameters for each entity needed.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
    "needsData": boolean,
    "entities": [
        {
            "entityName": "logicalname",
            "select": ["field1", "field2"],
            "filter": "OData filter expression or null",
            "orderby": "fieldname desc or null",
            "top": number or null,
            "aggregation": { "field": "fieldname", "operation": "sum|avg|min|max|count" } or null,
            "groupBy": "fieldname or null"
        }
    ],
    "explanation": "Brief explanation of what data will be fetched"
}

Common filter patterns for Dynamics 365:
- statecode eq 0 (active records)
- statecode eq 1 (inactive records)
- createdon gt 2024-01-01 (created after date)
- contains(name, 'value') (contains text)
- ownerid/systemuserid eq 'guid' (owned by user)

If the query doesn't need data, return:
{
    "needsData": false,
    "entities": [],
    "explanation": "This is a metadata/schema query"
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();
            
            // Clean up response - remove markdown code blocks if present
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            try {
                const parsed = JSON.parse(text);
                return {
                    needsData: parsed.needsData || false,
                    entities: parsed.entities || [],
                    explanation: parsed.explanation || '',
                };
            } catch (parseError) {
                console.error('Failed to parse query intent response:', text);
                return {
                    needsData: false,
                    entities: [],
                    explanation: 'Could not determine query intent',
                };
            }
        } catch (error) {
            console.error('Gemini Query Intent Error:', error);
            return {
                needsData: false,
                entities: [],
                explanation: 'Error analyzing query intent',
            };
        }
    }

    /**
     * Analyze data results and generate response
     */
    async analyzeWithData(
        metadata: string,
        dataResults: { entityName: string; records: any[]; totalCount?: number; query: string; error?: string }[],
        question: string,
        userApiKey?: string,
    ): Promise<string> {
        try {
            const model = this.getModel(userApiKey);
            
            const dataContext = dataResults.map(dr => {
                if (dr.error) {
                    return `Entity: ${dr.entityName}\nError: ${dr.error}`;
                }
                return `Entity: ${dr.entityName}\nTotal Records: ${dr.totalCount || dr.records.length}\nSample Data (${dr.records.length} records):\n${JSON.stringify(dr.records.slice(0, 20), null, 2)}`;
            }).join('\n\n---\n\n');

            const prompt = `You are an expert Microsoft Dynamics 365 analyst. Answer the user's question using the provided metadata AND actual data records.

METADATA (Schema Information):
${metadata}

ACTUAL DATA FROM DATAVERSE:
${dataContext}

User Question: ${question}

Instructions:
- Combine metadata knowledge with actual data insights
- If showing data, format it as a clear markdown TABLE
- Include counts, summaries, or aggregations as appropriate
- Use proper Dynamics 365 terminology
- Be specific with actual values from the data
- If there are too many records, summarize and show key examples
- Format numbers and dates nicely
- If there was an error fetching data, explain it

Answer:`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini Data Analysis Error:', error);
            throw new HttpException(
                'Failed to analyze data. Please try again.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
