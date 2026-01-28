import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as ExcelJS from 'exceljs';
import { SavedQuery } from './saved-query.entity';
import { EnvironmentsService } from '../environments/environments.service';
import { DataverseService } from '../dataverse/dataverse.service';
import {
    EntityMetadataDto,
    AttributeMetadataDto,
    RelationshipMetadataDto,
    QueryDefinitionDto,
    QueryResultDto,
    CreateSavedQueryDto,
    UpdateSavedQueryDto,
    SavedQueryResponseDto,
    FilterOperator,
} from './dto/query-designer.dto';

@Injectable()
export class QueryDesignerService {
    constructor(
        @InjectRepository(SavedQuery)
        private savedQueryRepository: Repository<SavedQuery>,
        private environmentsService: EnvironmentsService,
        private dataverseService: DataverseService,
    ) {}

    // ============== Metadata Methods ==============

    /**
     * Get all entities from an environment
     */
    async getEntities(
        userId: string,
        environmentId: string,
    ): Promise<EntityMetadataDto[]> {
        const environment = await this.environmentsService.getEnvironmentEntity(
            environmentId,
            userId,
        );

        const accessToken = await this.dataverseService.authenticate(environment);

        const response = await axios.get(
            `${environment.organizationUrl}/api/data/v9.2/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,Description,IsCustomEntity&$filter=IsValidForAdvancedFind eq true`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'OData-MaxVersion': '4.0',
                    'OData-Version': '4.0',
                    Accept: 'application/json',
                },
            },
        );

        return response.data.value.map((e: any) => ({
            logicalName: e.LogicalName,
            displayName: e.DisplayName?.UserLocalizedLabel?.Label || e.LogicalName,
            entitySetName: e.EntitySetName,
            primaryIdAttribute: e.PrimaryIdAttribute,
            primaryNameAttribute: e.PrimaryNameAttribute,
            description: e.Description?.UserLocalizedLabel?.Label,
            isCustomEntity: e.IsCustomEntity,
        }));
    }

    /**
     * Get attributes for an entity
     */
    async getEntityAttributes(
        userId: string,
        environmentId: string,
        entityLogicalName: string,
    ): Promise<AttributeMetadataDto[]> {
        const environment = await this.environmentsService.getEnvironmentEntity(
            environmentId,
            userId,
        );

        const accessToken = await this.dataverseService.authenticate(environment);

        const response = await axios.get(
            `${environment.organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes?$select=LogicalName,DisplayName,AttributeType,IsPrimaryId,IsPrimaryName,RequiredLevel,IsCustomAttribute,Description`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'OData-MaxVersion': '4.0',
                    'OData-Version': '4.0',
                    Accept: 'application/json',
                },
            },
        );

        const attributes: AttributeMetadataDto[] = [];

        for (const attr of response.data.value) {
            const attrDto: AttributeMetadataDto = {
                logicalName: attr.LogicalName,
                displayName: attr.DisplayName?.UserLocalizedLabel?.Label || attr.LogicalName,
                attributeType: attr.AttributeType,
                isPrimaryId: attr.IsPrimaryId || false,
                isPrimaryName: attr.IsPrimaryName || false,
                isRequired: attr.RequiredLevel?.Value === 'ApplicationRequired' || attr.RequiredLevel?.Value === 'SystemRequired',
                isCustomAttribute: attr.IsCustomAttribute || false,
                description: attr.Description?.UserLocalizedLabel?.Label,
            };

            // For Lookup attributes, get targets
            if (attr.AttributeType === 'Lookup' || attr.AttributeType === 'Customer' || attr.AttributeType === 'Owner') {
                try {
                    const lookupResponse = await axios.get(
                        `${environment.organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes(LogicalName='${attr.LogicalName}')/Microsoft.Dynamics.CRM.LookupAttributeMetadata?$select=Targets`,
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                            },
                        },
                    );
                    attrDto.targets = lookupResponse.data.Targets;
                } catch {
                    // Ignore lookup metadata errors
                }
            }

            // For Picklist/Status attributes, get options
            if (attr.AttributeType === 'Picklist' || attr.AttributeType === 'State' || attr.AttributeType === 'Status') {
                try {
                    const picklistResponse = await axios.get(
                        `${environment.organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes(LogicalName='${attr.LogicalName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$expand=OptionSet($select=Options)`,
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                            },
                        },
                    );
                    if (picklistResponse.data.OptionSet?.Options) {
                        attrDto.options = picklistResponse.data.OptionSet.Options.map((opt: any) => ({
                            value: opt.Value,
                            label: opt.Label?.UserLocalizedLabel?.Label || `${opt.Value}`,
                        }));
                    }
                } catch {
                    // Ignore picklist metadata errors
                }
            }

            attributes.push(attrDto);
        }

        return attributes;
    }

    /**
     * Get relationships for an entity
     */
    async getEntityRelationships(
        userId: string,
        environmentId: string,
        entityLogicalName: string,
    ): Promise<RelationshipMetadataDto[]> {
        const environment = await this.environmentsService.getEnvironmentEntity(
            environmentId,
            userId,
        );

        const accessToken = await this.dataverseService.authenticate(environment);

        const relationships: RelationshipMetadataDto[] = [];

        // Get One-to-Many relationships
        try {
            const oneToManyResponse = await axios.get(
                `${environment.organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')/OneToManyRelationships?$select=SchemaName,ReferencingEntity,ReferencingAttribute,ReferencedEntity,ReferencedAttribute`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'OData-MaxVersion': '4.0',
                        'OData-Version': '4.0',
                        Accept: 'application/json',
                    },
                },
            );

            for (const rel of oneToManyResponse.data.value) {
                relationships.push({
                    schemaName: rel.SchemaName,
                    relationshipType: 'OneToMany',
                    referencingEntity: rel.ReferencingEntity,
                    referencingAttribute: rel.ReferencingAttribute,
                    referencedEntity: rel.ReferencedEntity,
                    referencedAttribute: rel.ReferencedAttribute,
                });
            }
        } catch (error) {
            console.error('Error fetching OneToMany relationships:', error.message);
        }

        // Get Many-to-One relationships
        try {
            const manyToOneResponse = await axios.get(
                `${environment.organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')/ManyToOneRelationships?$select=SchemaName,ReferencingEntity,ReferencingAttribute,ReferencedEntity,ReferencedAttribute`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'OData-MaxVersion': '4.0',
                        'OData-Version': '4.0',
                        Accept: 'application/json',
                    },
                },
            );

            for (const rel of manyToOneResponse.data.value) {
                relationships.push({
                    schemaName: rel.SchemaName,
                    relationshipType: 'ManyToOne',
                    referencingEntity: rel.ReferencingEntity,
                    referencingAttribute: rel.ReferencingAttribute,
                    referencedEntity: rel.ReferencedEntity,
                    referencedAttribute: rel.ReferencedAttribute,
                });
            }
        } catch (error) {
            console.error('Error fetching ManyToOne relationships:', error.message);
        }

        return relationships;
    }

    // ============== Query Execution Methods ==============

    /**
     * Execute a query definition and return results
     */
    async executeQuery(
        userId: string,
        query: QueryDefinitionDto,
        page: number = 1,
        pageSize: number = 50,
        countOnly: boolean = false,
    ): Promise<QueryResultDto> {
        const startTime = Date.now();

        const environment = await this.environmentsService.getEnvironmentEntity(
            query.environmentId,
            userId,
        );

        const accessToken = await this.dataverseService.authenticate(environment);

        // Get entity set name
        const entitySetName = await this.getEntitySetName(
            accessToken,
            environment.organizationUrl,
            query.primaryEntity,
        );

        // Build OData query
        const odataQuery = this.buildODataQuery(query, page, pageSize, countOnly);
        const url = `${environment.organizationUrl}/api/data/v9.2/${entitySetName}${odataQuery}`;

        console.log('[QueryDesigner] Executing query:', url);

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                Accept: 'application/json',
                Prefer: 'odata.include-annotations="*",odata.maxpagesize=' + pageSize,
            },
        });

        const totalCount = response.data['@odata.count'];
        const records = response.data.value || [];

        // Build column definitions
        const columns = query.fields.map((f) => ({
            name: f.fieldName,
            displayName: f.displayName || f.fieldName,
            type: 'string', // Would need to fetch attribute types for accurate typing
            entityAlias: f.entityAlias,
        }));

        // Transform records to match selected fields
        const rows = records.map((record: any) => {
            const row: Record<string, any> = {};
            for (const field of query.fields) {
                const key = `${field.entityAlias}.${field.fieldName}`;
                // Handle expanded navigation properties
                if (field.entityAlias !== (query.primaryEntityAlias || 'main')) {
                    const expandedData = record[field.entityAlias];
                    row[key] = expandedData?.[field.fieldName] ?? 
                               record[`${field.fieldName}@OData.Community.Display.V1.FormattedValue`] ??
                               record[field.fieldName];
                } else {
                    row[key] = record[`${field.fieldName}@OData.Community.Display.V1.FormattedValue`] ??
                               record[field.fieldName];
                }
            }
            return row;
        });

        return {
            columns,
            rows,
            totalCount,
            page,
            pageSize,
            hasMore: records.length === pageSize,
            executionTime: Date.now() - startTime,
        };
    }

    /**
     * Build OData query string from query definition
     */
    private buildODataQuery(
        query: QueryDefinitionDto,
        page: number,
        pageSize: number,
        countOnly: boolean,
    ): string {
        const params: string[] = [];

        // Always include count
        params.push('$count=true');

        // Select fields
        const primaryAlias = query.primaryEntityAlias || 'main';
        const mainFields = query.fields
            .filter((f) => f.entityAlias === primaryAlias)
            .map((f) => f.fieldName);
        
        if (mainFields.length > 0) {
            params.push(`$select=${mainFields.join(',')}`);
        }

        // Expand for joins
        if (query.joins && query.joins.length > 0) {
            const expands: string[] = [];
            
            for (const join of query.joins) {
                const joinFields = query.fields
                    .filter((f) => f.entityAlias === join.toEntityAlias)
                    .map((f) => f.fieldName);
                
                if (joinFields.length > 0) {
                    // Use navigation property name (usually the lookup field without 'id')
                    const navProperty = join.fromField.replace(/id$/i, '');
                    expands.push(`${navProperty}($select=${joinFields.join(',')})`);
                }
            }

            if (expands.length > 0) {
                params.push(`$expand=${expands.join(',')}`);
            }
        }

        // Filters
        if (query.filters && query.filters.length > 0) {
            const filterExpressions = query.filters.map((f, idx) => {
                const expr = this.buildFilterExpression(f);
                if (idx === 0) return expr;
                return `${f.logicalOperator || 'and'} ${expr}`;
            });
            params.push(`$filter=${filterExpressions.join(' ')}`);
        }

        // Order by
        if (query.orderBy && query.orderBy.length > 0) {
            const orderExpressions = query.orderBy.map(
                (o) => `${o.fieldName} ${o.direction || 'asc'}`,
            );
            params.push(`$orderby=${orderExpressions.join(',')}`);
        }

        // Pagination
        if (!countOnly) {
            params.push(`$top=${pageSize}`);
            if (page > 1) {
                params.push(`$skip=${(page - 1) * pageSize}`);
            }
        } else {
            params.push('$top=0');
        }

        return '?' + params.join('&');
    }

    /**
     * Build a single filter expression
     */
    private buildFilterExpression(filter: {
        fieldName: string;
        operator: string;
        value?: any;
    }): string {
        const field = filter.fieldName;
        const op = filter.operator;
        const value = filter.value;

        switch (op) {
            case FilterOperator.EQUALS:
                return typeof value === 'string'
                    ? `${field} eq '${value}'`
                    : `${field} eq ${value}`;
            case FilterOperator.NOT_EQUALS:
                return typeof value === 'string'
                    ? `${field} ne '${value}'`
                    : `${field} ne ${value}`;
            case FilterOperator.GREATER_THAN:
                return `${field} gt ${value}`;
            case FilterOperator.GREATER_OR_EQUAL:
                return `${field} ge ${value}`;
            case FilterOperator.LESS_THAN:
                return `${field} lt ${value}`;
            case FilterOperator.LESS_OR_EQUAL:
                return `${field} le ${value}`;
            case FilterOperator.CONTAINS:
                return `contains(${field},'${value}')`;
            case FilterOperator.STARTS_WITH:
                return `startswith(${field},'${value}')`;
            case FilterOperator.ENDS_WITH:
                return `endswith(${field},'${value}')`;
            case FilterOperator.IS_NULL:
                return `${field} eq null`;
            case FilterOperator.IS_NOT_NULL:
                return `${field} ne null`;
            default:
                return `${field} eq '${value}'`;
        }
    }

    /**
     * Get entity set name
     */
    private async getEntitySetName(
        accessToken: string,
        organizationUrl: string,
        entityLogicalName: string,
    ): Promise<string> {
        const response = await axios.get(
            `${organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')?$select=EntitySetName`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'OData-MaxVersion': '4.0',
                    'OData-Version': '4.0',
                    Accept: 'application/json',
                },
            },
        );
        return response.data.EntitySetName;
    }

    // ============== Export Methods ==============

    /**
     * Export query results to Excel
     */
    async exportToExcel(
        userId: string,
        query: QueryDefinitionDto,
    ): Promise<Buffer> {
        // Fetch all results (up to 5000)
        const result = await this.executeQuery(userId, query, 1, 5000, false);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'DVerse-AI Query Designer';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Query Results');

        // Define columns
        worksheet.columns = result.columns.map((col) => ({
            header: col.displayName,
            key: `${col.entityAlias}.${col.name}`,
            width: 20,
        }));

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Add data rows
        for (const row of result.rows) {
            worksheet.addRow(row);
        }

        // Auto-filter
        if (result.rows.length > 0) {
            worksheet.autoFilter = {
                from: 'A1',
                to: `${String.fromCharCode(64 + result.columns.length)}${result.rows.length + 1}`,
            };
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    // ============== Saved Query CRUD ==============

    async createSavedQuery(
        userId: string,
        dto: CreateSavedQueryDto,
    ): Promise<SavedQueryResponseDto> {
        const savedQuery = this.savedQueryRepository.create({
            userId,
            environmentId: dto.environmentId,
            name: dto.name,
            description: dto.description,
            definition: dto.definition,
        });

        const saved = await this.savedQueryRepository.save(savedQuery);
        return this.toResponseDto(saved);
    }

    async getSavedQueries(userId: string): Promise<SavedQueryResponseDto[]> {
        const queries = await this.savedQueryRepository.find({
            where: { userId },
            order: { updatedAt: 'DESC' },
        });
        return queries.map((q) => this.toResponseDto(q));
    }

    async getSavedQuery(
        id: string,
        userId: string,
    ): Promise<SavedQueryResponseDto> {
        const query = await this.savedQueryRepository.findOne({
            where: { id, userId },
        });

        if (!query) {
            throw new HttpException('Saved query not found', HttpStatus.NOT_FOUND);
        }

        return this.toResponseDto(query);
    }

    async updateSavedQuery(
        id: string,
        userId: string,
        dto: UpdateSavedQueryDto,
    ): Promise<SavedQueryResponseDto> {
        const query = await this.savedQueryRepository.findOne({
            where: { id, userId },
        });

        if (!query) {
            throw new HttpException('Saved query not found', HttpStatus.NOT_FOUND);
        }

        Object.assign(query, dto);
        const updated = await this.savedQueryRepository.save(query);
        return this.toResponseDto(updated);
    }

    async deleteSavedQuery(id: string, userId: string): Promise<void> {
        const query = await this.savedQueryRepository.findOne({
            where: { id, userId },
        });

        if (!query) {
            throw new HttpException('Saved query not found', HttpStatus.NOT_FOUND);
        }

        await this.savedQueryRepository.remove(query);
    }

    private toResponseDto(query: SavedQuery): SavedQueryResponseDto {
        return {
            id: query.id,
            name: query.name,
            description: query.description,
            environmentId: query.environmentId,
            definition: query.definition as any,
            createdAt: query.createdAt,
            updatedAt: query.updatedAt,
        };
    }
}
