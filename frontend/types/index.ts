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

// ============== Query Designer Types ==============

export interface EntityMetadata {
    logicalName: string;
    displayName: string;
    entitySetName: string;
    primaryIdAttribute: string;
    primaryNameAttribute: string;
    description?: string;
    isCustomEntity: boolean;
}

export interface AttributeMetadata {
    logicalName: string;
    displayName: string;
    attributeType: string;
    isPrimaryId: boolean;
    isPrimaryName: boolean;
    isRequired: boolean;
    isCustomAttribute: boolean;
    description?: string;
    targets?: string[];
    options?: { value: number; label: string }[];
}

export interface RelationshipMetadata {
    schemaName: string;
    relationshipType: 'OneToMany' | 'ManyToOne' | 'ManyToMany';
    referencingEntity: string;
    referencingAttribute: string;
    referencedEntity: string;
    referencedAttribute: string;
    displayName?: string;
}

export interface QueryField {
    entityAlias: string;
    fieldName: string;
    displayName?: string;
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

export interface QueryJoin {
    fromEntityAlias: string;
    fromField: string;
    toEntity: string;
    toEntityAlias: string;
    toField: string;
    joinType?: 'inner' | 'left';
}

export type FilterOperator = 
    | 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' 
    | 'contains' | 'startswith' | 'endswith' 
    | 'null' | 'notnull';

export interface QueryFilter {
    entityAlias: string;
    fieldName: string;
    operator: FilterOperator;
    value?: any;
    logicalOperator?: 'and' | 'or';
}

export interface QuerySort {
    entityAlias: string;
    fieldName: string;
    direction?: 'asc' | 'desc';
}

export interface QueryDefinition {
    environmentId: string;
    primaryEntity: string;
    primaryEntityAlias?: string;
    fields: QueryField[];
    joins?: QueryJoin[];
    filters?: QueryFilter[];
    orderBy?: QuerySort[];
    top?: number;
    skip?: number;
}

export interface SavedQuery {
    id: string;
    name: string;
    description?: string;
    environmentId: string;
    definition: QueryDefinition;
    createdAt: string;
    updatedAt: string;
}

export interface QueryResult {
    columns: {
        name: string;
        displayName: string;
        type: string;
        entityAlias: string;
    }[];
    rows: Record<string, any>[];
    totalCount?: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
    executionTime: number;
}
