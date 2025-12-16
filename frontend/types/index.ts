export interface User {
    id: string;
    email: string;
    name: string | null;
    profilePhotoUrl?: string | null;
    language?: 'es' | 'en';
    createdAt: string;
}

export interface Environment {
    id: string;
    name: string;
    organizationUrl: string;
    clientId: string;
    tenantId: string;
    description?: string;
    status: 'connected' | 'disconnected' | 'error';
    lastSyncAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
    metadata?: Record<string, any>;
}

export interface Conversation {
    id: string;
    title: string;
    environmentId?: string;
    environmentName?: string;
    createdAt: string;
    updatedAt: string;
    messages?: Message[];
}

export interface AuthResponse {
    user: User;
    accessToken: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface CreateEnvironmentData {
    name: string;
    organizationUrl: string;
    clientId: string;
    clientSecret: string;
    tenantId: string;
    description?: string;
}

export interface UpdateEnvironmentData {
    name?: string;
    organizationUrl?: string;
    clientId?: string;
    clientSecret?: string;
    tenantId?: string;
    description?: string;
}

export interface SendMessageData {
    conversationId?: string;
    environmentIds: string[];
    message: string;
    image?: string;
}

export interface ChatResponse {
    conversationId: string;
    message: {
        role: string;
        content: string;
    };
}

export interface UserSettings {
    useFreeTier: boolean;
    hasGeminiApiKey: boolean;
}

export interface UpdateSettingsData {
    geminiApiKey?: string;
    useFreeTier?: boolean;
}
