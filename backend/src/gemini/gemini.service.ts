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
}
