import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// ============== Metadata DTOs ==============

export interface EntityMetadataDto {
    logicalName: string;
    displayName: string;
    entitySetName: string;
    primaryIdAttribute: string;
    primaryNameAttribute: string;
    description?: string;
    isCustomEntity: boolean;
}

export interface AttributeMetadataDto {
    logicalName: string;
    displayName: string;
    attributeType: string;
    isPrimaryId: boolean;
    isPrimaryName: boolean;
    isRequired: boolean;
    isCustomAttribute: boolean;
    description?: string;
    // For lookups
    targets?: string[];
    // For picklists
    options?: { value: number; label: string }[];
}

export interface RelationshipMetadataDto {
    schemaName: string;
    relationshipType: 'OneToMany' | 'ManyToOne' | 'ManyToMany';
    referencingEntity: string;
    referencingAttribute: string;
    referencedEntity: string;
    referencedAttribute: string;
    displayName?: string;
}

// ============== Query Definition DTOs ==============

export class QueryFieldDto {
    @IsString()
    entityAlias: string;

    @IsString()
    fieldName: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

export class QueryJoinDto {
    @IsString()
    fromEntityAlias: string;

    @IsString()
    fromField: string;

    @IsString()
    toEntity: string;

    @IsString()
    toEntityAlias: string;

    @IsString()
    toField: string;

    @IsOptional()
    @IsString()
    joinType?: 'inner' | 'left';
}

export enum FilterOperator {
    EQUALS = 'eq',
    NOT_EQUALS = 'ne',
    GREATER_THAN = 'gt',
    GREATER_OR_EQUAL = 'ge',
    LESS_THAN = 'lt',
    LESS_OR_EQUAL = 'le',
    CONTAINS = 'contains',
    STARTS_WITH = 'startswith',
    ENDS_WITH = 'endswith',
    IS_NULL = 'null',
    IS_NOT_NULL = 'notnull',
}

export class QueryFilterDto {
    @IsString()
    entityAlias: string;

    @IsString()
    fieldName: string;

    @IsEnum(FilterOperator)
    operator: FilterOperator;

    @IsOptional()
    value?: any;

    @IsOptional()
    @IsString()
    logicalOperator?: 'and' | 'or';
}

export class QuerySortDto {
    @IsString()
    entityAlias: string;

    @IsString()
    fieldName: string;

    @IsOptional()
    @IsString()
    direction?: 'asc' | 'desc';
}

export class QueryDefinitionDto {
    @IsString()
    environmentId: string;

    @IsString()
    primaryEntity: string;

    @IsOptional()
    @IsString()
    primaryEntityAlias?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QueryFieldDto)
    fields: QueryFieldDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QueryJoinDto)
    joins?: QueryJoinDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QueryFilterDto)
    filters?: QueryFilterDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuerySortDto)
    orderBy?: QuerySortDto[];

    @IsOptional()
    @IsNumber()
    top?: number;

    @IsOptional()
    @IsNumber()
    skip?: number;
}

// ============== Saved Query DTOs ==============

export class CreateSavedQueryDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    environmentId: string;

    @ValidateNested()
    @Type(() => QueryDefinitionDto)
    definition: QueryDefinitionDto;
}

export class UpdateSavedQueryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => QueryDefinitionDto)
    definition?: QueryDefinitionDto;
}

export interface SavedQueryResponseDto {
    id: string;
    name: string;
    description?: string;
    environmentId: string;
    definition: QueryDefinitionDto;
    createdAt: Date;
    updatedAt: Date;
}

// ============== Execution DTOs ==============

export class ExecuteQueryDto {
    @ValidateNested()
    @Type(() => QueryDefinitionDto)
    query: QueryDefinitionDto;

    @IsOptional()
    @IsNumber()
    page?: number;

    @IsOptional()
    @IsNumber()
    pageSize?: number;

    @IsOptional()
    @IsBoolean()
    countOnly?: boolean;
}

export interface QueryResultDto {
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

export interface ExportQueryDto extends ExecuteQueryDto {
    format: 'xlsx' | 'csv';
    fileName?: string;
}
