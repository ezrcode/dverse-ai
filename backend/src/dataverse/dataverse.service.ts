import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Environment } from '../environments/environment.entity';
import { EncryptionService } from '../common/encryption.service';

interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

interface MetadataResult {
    entities: any[];
    forms?: any[];
    views?: any[];
    workflows?: any[];
    summary: string;
}

@Injectable()
export class DataverseService {
    constructor(
        private configService: ConfigService,
        private encryptionService: EncryptionService,
    ) { }

    /**
     * Authenticate with Microsoft Dynamics 365 using OAuth2 Client Credentials flow
     */
    async authenticate(environment: Environment): Promise<string> {
        try {
            const clientSecret = this.encryptionService.decrypt(
                environment.clientSecret,
            );

            const tokenUrl = `https://login.microsoftonline.com/${environment.tenantId}/oauth2/v2.0/token`;

            const params = new URLSearchParams({
                client_id: environment.clientId,
                client_secret: clientSecret,
                scope: `${environment.organizationUrl}/.default`,
                grant_type: 'client_credentials',
            });

            const response = await axios.post<TokenResponse>(tokenUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            return response.data.access_token;
        } catch (error) {
            console.error('D365 Authentication Error:', error.response?.data || error.message);
            throw new HttpException(
                'Failed to authenticate with Dynamics 365',
                HttpStatus.UNAUTHORIZED,
            );
        }
    }

    /**
     * Test connection to D365 environment
     */
    async testConnection(environment: Environment): Promise<boolean> {
        try {
            const accessToken = await this.authenticate(environment);

            // Use WhoAmI endpoint - most reliable for testing connection
            const response = await axios.get(
                `${environment.organizationUrl}/api/data/v9.2/WhoAmI`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'OData-MaxVersion': '4.0',
                        'OData-Version': '4.0',
                        Accept: 'application/json',
                    },
                },
            );

            return response.status === 200;
        } catch (error) {
            console.error('D365 Connection Test Error:', error.response?.data || error.message);
            return false;
        }
    }

    /**
     * Fetch metadata based on user query context
     * Intelligently detects entity names in the query and fetches their attributes
     */
    async fetchMetadata(
        accessToken: string,
        organizationUrl: string,
        query: string,
    ): Promise<MetadataResult> {
        try {
            // Fetch all entity definitions
            const entitiesResponse = await axios.get(
                `${organizationUrl}/api/data/v9.2/EntityDefinitions`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'OData-MaxVersion': '4.0',
                        'OData-Version': '4.0',
                        Accept: 'application/json',
                    },
                },
            );

            const allEntities = entitiesResponse.data.value;
            const queryLower = query.toLowerCase();

            console.log('Query received:', query);
            console.log('Total entities in environment:', allEntities.length);

            // Find entities mentioned in the query
            const mentionedEntities = allEntities.filter((e: any) => {
                const logicalName = e.LogicalName?.toLowerCase() || '';
                const displayName = e.DisplayName?.UserLocalizedLabel?.Label?.toLowerCase() || '';
                // Check if entity name appears in query OR if query contains the entity name
                const isMatch = queryLower.includes(logicalName) || 
                               (displayName && queryLower.includes(displayName)) ||
                               logicalName.includes(queryLower.split(' ').find((w: string) => w.startsWith('dec_') || w.startsWith('new_') || w.includes('_')) || '___nomatch___');
                return isMatch;
            });

            console.log('Mentioned entities found:', mentionedEntities.length, mentionedEntities.map((e: any) => e.LogicalName));

            // If specific entities are mentioned, fetch their attributes
            const entitiesWithAttributes: any[] = [];
            
            // Detect what type of metadata the user is asking for
            const asksForForms = /formulario|form|forms/i.test(query);
            const asksForViews = /vista|view|views|grid|lista/i.test(query);
            const asksForWorkflows = /workflow|flujo|proceso|automatizaci|power\s*automate|cloud\s*flow|flow|business\s*rule|regla\s*de\s*negocio|bpf|business\s*process/i.test(query);
            const asksForPowerAutomate = /power\s*automate|cloud\s*flow|modern\s*flow/i.test(query);

            console.log('User asks for - Forms:', asksForForms, 'Views:', asksForViews, 'Workflows:', asksForWorkflows, 'PowerAutomate:', asksForPowerAutomate);

            if (mentionedEntities.length > 0 && mentionedEntities.length <= 5) {
                // Fetch data for mentioned entities (max 5 to avoid too many requests)
                let allForms: any[] = [];
                let allViews: any[] = [];
                let allWorkflows: any[] = [];

                for (const entity of mentionedEntities) {
                    try {
                        // Always fetch attributes
                        const attributesResponse = await axios.get(
                            `${organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entity.LogicalName}')/Attributes`,
                            {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    'OData-MaxVersion': '4.0',
                                    'OData-Version': '4.0',
                                    Accept: 'application/json',
                                },
                            },
                        );

                        const attributes = attributesResponse.data.value.map((attr: any) => ({
                            LogicalName: attr.LogicalName,
                            DisplayName: attr.DisplayName?.UserLocalizedLabel?.Label || attr.LogicalName,
                            AttributeType: attr.AttributeType,
                            RequiredLevel: attr.RequiredLevel?.Value,
                            Description: attr.Description?.UserLocalizedLabel?.Label,
                            IsCustomAttribute: attr.IsCustomAttribute,
                        }));

                        // Create attribute lookup for enriching form/view fields
                        const attrLookup = new Map(attributes.map((a: any) => [a.LogicalName, a.DisplayName]));

                        // Fetch forms if requested
                        let entityForms: any[] = [];
                        if (asksForForms) {
                            entityForms = await this.fetchEntityForms(accessToken, organizationUrl, entity.LogicalName);
                            // Enrich form fields with display names
                            entityForms = entityForms.map(form => ({
                                ...form,
                                Fields: form.Fields.map((f: string) => ({
                                    LogicalName: f,
                                    DisplayName: attrLookup.get(f) || f,
                                })),
                            }));
                            allForms.push(...entityForms.map(f => ({ ...f, EntityLogicalName: entity.LogicalName })));
                        }

                        // Fetch views if requested
                        let entityViews: any[] = [];
                        if (asksForViews) {
                            entityViews = await this.fetchEntityViews(accessToken, organizationUrl, entity.LogicalName);
                            // Enrich view columns with display names
                            entityViews = entityViews.map(view => ({
                                ...view,
                                Columns: view.Columns.map((c: string) => ({
                                    LogicalName: c,
                                    DisplayName: attrLookup.get(c) || c,
                                })),
                            }));
                            allViews.push(...entityViews.map(v => ({ ...v, EntityLogicalName: entity.LogicalName })));
                        }

                        // Fetch workflows if requested
                        if (asksForWorkflows) {
                            const entityWorkflows = await this.fetchWorkflows(accessToken, organizationUrl, entity.LogicalName);
                            allWorkflows.push(...entityWorkflows);
                        }

                        entitiesWithAttributes.push({
                            LogicalName: entity.LogicalName,
                            DisplayName: entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName,
                            Description: entity.Description?.UserLocalizedLabel?.Label,
                            Attributes: attributes,
                            FormsCount: entityForms.length,
                            ViewsCount: entityViews.length,
                        });
                    } catch (attrError) {
                        console.error(`Failed to fetch data for ${entity.LogicalName}:`, attrError.message);
                        entitiesWithAttributes.push({
                            LogicalName: entity.LogicalName,
                            DisplayName: entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName,
                            Description: entity.Description?.UserLocalizedLabel?.Label,
                            Attributes: [],
                        });
                    }
                }

                const totalAttributes = entitiesWithAttributes.reduce((sum, e) => sum + e.Attributes.length, 0);
                let summaryParts = [`Found ${mentionedEntities.length} entity(ies) with ${totalAttributes} total attributes`];
                
                if (allForms.length > 0) summaryParts.push(`${allForms.length} forms`);
                if (allViews.length > 0) summaryParts.push(`${allViews.length} views`);
                if (allWorkflows.length > 0) summaryParts.push(`${allWorkflows.length} workflows`);

                return {
                    entities: entitiesWithAttributes,
                    forms: allForms.length > 0 ? allForms : undefined,
                    views: allViews.length > 0 ? allViews : undefined,
                    workflows: allWorkflows.length > 0 ? allWorkflows : undefined,
                    summary: summaryParts.join(', ') + '.',
                };
            }

            // If user asks for workflows/Power Automate globally (without specific entity)
            if (asksForWorkflows && mentionedEntities.length === 0) {
                let workflows: any[] = [];
                
                if (asksForPowerAutomate) {
                    // Fetch specifically Power Automate flows (categories 1, 5, 6)
                    workflows = await this.fetchPowerAutomateFlows(accessToken, organizationUrl);
                    
                    // Also fetch all workflows to check for any with Power Automate characteristics
                    const allWorkflows = await this.fetchWorkflows(accessToken, organizationUrl);
                    const powerAutomateFromAll = allWorkflows.filter((wf: any) => 
                        wf.CategoryCode === 1 || wf.CategoryCode === 5 || wf.CategoryCode === 6
                    );
                    
                    // Merge and dedupe
                    const allFlowIds = new Set(workflows.map((f: any) => f.FlowId));
                    powerAutomateFromAll.forEach((wf: any) => {
                        if (!allFlowIds.has(wf.WorkflowId)) {
                            workflows.push({
                                FlowId: wf.WorkflowId,
                                Name: wf.Name,
                                Description: wf.Description,
                                PrimaryEntity: wf.PrimaryEntity,
                                State: wf.State,
                                Type: wf.Category,
                                CreatedOn: wf.CreatedOn,
                                ModifiedOn: wf.ModifiedOn,
                            });
                        }
                    });
                    
                    const activeFlows = workflows.filter((f: any) => f.State === 'On' || f.State === 'Active').length;
                    
                    let summary = `Found ${workflows.length} Power Automate/Cloud Flows in Dataverse (${activeFlows} active). `;
                    if (workflows.length === 0) {
                        summary += 'Note: Only solution-aware flows are visible in Dataverse. Non-solution flows must be viewed in Power Automate portal (flow.microsoft.com).';
                    }
                    
                    return {
                        entities: [],
                        workflows: workflows.slice(0, 50),
                        summary,
                    };
                } else {
                    // Fetch all workflow types
                    workflows = await this.fetchWorkflows(accessToken, organizationUrl);
                    
                    // Group by category for better summary
                    const byCategory = workflows.reduce((acc: Record<string, number>, wf: any) => {
                        acc[wf.Category] = (acc[wf.Category] || 0) + 1;
                        return acc;
                    }, {});
                    
                    const categoryBreakdown = Object.entries(byCategory)
                        .map(([cat, count]) => `${count} ${cat}`)
                        .join(', ');
                    
                    return {
                        entities: [],
                        workflows: workflows.slice(0, 50),
                        summary: `Found ${workflows.length} workflows/flows in the environment: ${categoryBreakdown}. (showing first 50)`,
                    };
                }
            }

            // If no specific entities mentioned or too many, return basic entity list
            const entities = allEntities.slice(0, 50).map((e: any) => ({
                LogicalName: e.LogicalName,
                DisplayName: e.DisplayName?.UserLocalizedLabel?.Label || e.LogicalName,
                Description: e.Description?.UserLocalizedLabel?.Label,
            }));

            return {
                entities,
                summary: `Found ${allEntities.length} entities in the Dataverse environment (showing first 50). Mention a specific entity name to see its fields/attributes.`,
            };
        } catch (error) {
            console.error('D365 Metadata Fetch Error:', error.response?.data || error.message);
            throw new HttpException(
                'Failed to fetch Dataverse metadata',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Fetch detailed entity metadata including attributes
     */
    async fetchEntityDetails(
        accessToken: string,
        organizationUrl: string,
        entityLogicalName: string,
    ): Promise<any> {
        try {
            // Fetch entity definition first
            const entityResponse = await axios.get(
                `${organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'OData-MaxVersion': '4.0',
                        'OData-Version': '4.0',
                        Accept: 'application/json',
                    },
                },
            );

            // Fetch attributes separately for better compatibility
            const attributesResponse = await axios.get(
                `${organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'OData-MaxVersion': '4.0',
                        'OData-Version': '4.0',
                        Accept: 'application/json',
                    },
                },
            );

            return {
                ...entityResponse.data,
                Attributes: attributesResponse.data.value,
            };
        } catch (error) {
            console.error('D365 Entity Details Fetch Error:', error.response?.data || error.message);
            throw new HttpException(
                `Failed to fetch entity details for ${entityLogicalName}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Fetch forms for a specific entity
     */
    async fetchEntityForms(
        accessToken: string,
        organizationUrl: string,
        entityLogicalName: string,
    ): Promise<any[]> {
        try {
            // Get the entity's ObjectTypeCode first
            const entityResponse = await axios.get(
                `${organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'OData-MaxVersion': '4.0',
                        'OData-Version': '4.0',
                        Accept: 'application/json',
                    },
                },
            );

            const objectTypeCode = entityResponse.data.ObjectTypeCode;

            // Fetch SystemForms for this entity
            const formsResponse = await axios.get(
                `${organizationUrl}/api/data/v9.2/systemforms?$filter=objecttypecode eq '${entityLogicalName}'`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'OData-MaxVersion': '4.0',
                        'OData-Version': '4.0',
                        Accept: 'application/json',
                    },
                },
            );

            return formsResponse.data.value.map((form: any) => {
                // Parse form XML to extract field names
                const fields = this.parseFormXmlForFields(form.formxml);
                
                return {
                    FormId: form.formid,
                    Name: form.name,
                    Description: form.description,
                    FormType: this.getFormTypeName(form.type),
                    IsActive: form.formactivationstate === 1,
                    Fields: fields,
                };
            });
        } catch (error) {
            console.error('D365 Forms Fetch Error:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Parse form XML to extract field logical names
     */
    private parseFormXmlForFields(formXml: string): string[] {
        if (!formXml) return [];
        
        const fields: string[] = [];
        // Simple regex to extract control datafieldname attributes
        const regex = /datafieldname="([^"]+)"/gi;
        let match;
        
        while ((match = regex.exec(formXml)) !== null) {
            if (!fields.includes(match[1])) {
                fields.push(match[1]);
            }
        }
        
        return fields;
    }

    /**
     * Get form type name from type code
     */
    private getFormTypeName(typeCode: number): string {
        const types: Record<number, string> = {
            0: 'Dashboard',
            1: 'AppointmentBook',
            2: 'Main',
            3: 'MiniCampaignBO',
            4: 'Preview',
            5: 'Mobile - Express',
            6: 'Quick View',
            7: 'Quick Create',
            8: 'Dialog',
            9: 'Task Flow',
            10: 'InteractionCentricDashboard',
            11: 'Card',
            12: 'Main - Interactive experience',
            100: 'Other',
            101: 'MainBackup',
            102: 'AppointmentBookBackup',
            103: 'Power BI Dashboard',
        };
        return types[typeCode] || `Unknown (${typeCode})`;
    }

    /**
     * Fetch views (SavedQuery) for a specific entity
     */
    async fetchEntityViews(
        accessToken: string,
        organizationUrl: string,
        entityLogicalName: string,
    ): Promise<any[]> {
        try {
            // Fetch SavedQuery (system views) for this entity
            const viewsResponse = await axios.get(
                `${organizationUrl}/api/data/v9.2/savedqueries?$filter=returnedtypecode eq '${entityLogicalName}'`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'OData-MaxVersion': '4.0',
                        'OData-Version': '4.0',
                        Accept: 'application/json',
                    },
                },
            );

            return viewsResponse.data.value.map((view: any) => {
                // Parse layoutxml to extract columns
                const columns = this.parseViewLayoutForColumns(view.layoutxml);
                
                return {
                    ViewId: view.savedqueryid,
                    Name: view.name,
                    Description: view.description,
                    IsDefault: view.isdefault,
                    IsActive: view.statecode === 0,
                    QueryType: view.querytype,
                    Columns: columns,
                };
            });
        } catch (error) {
            console.error('D365 Views Fetch Error:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Parse view layout XML to extract column names
     */
    private parseViewLayoutForColumns(layoutXml: string): string[] {
        if (!layoutXml) return [];
        
        const columns: string[] = [];
        // Simple regex to extract cell name attributes
        const regex = /name="([^"]+)"/gi;
        let match;
        
        while ((match = regex.exec(layoutXml)) !== null) {
            if (!columns.includes(match[1])) {
                columns.push(match[1]);
            }
        }
        
        return columns;
    }

    /**
     * Fetch workflows for a specific entity or all workflows
     * Includes: Classic Workflows (0), Business Rules (2), Actions (3), 
     * Business Process Flows (4), Power Automate/Cloud Flows (5), Desktop Flows (6)
     */
    async fetchWorkflows(
        accessToken: string,
        organizationUrl: string,
        entityLogicalName?: string,
    ): Promise<any[]> {
        try {
            // Fetch all workflow categories (0=Workflow, 2=BusinessRule, 3=Action, 4=BPF, 5=PowerAutomate, 6=DesktopFlow)
            let url = `${organizationUrl}/api/data/v9.2/workflows?$select=workflowid,name,description,primaryentity,category,type,statecode,mode,scope,triggeroncreate,triggeronupdateattributelist,triggerondelete,createdon,modifiedon,clientdata`;
            
            if (entityLogicalName) {
                url += `&$filter=primaryentity eq '${entityLogicalName}'`;
            }

            const workflowsResponse = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'OData-MaxVersion': '4.0',
                    'OData-Version': '4.0',
                    Accept: 'application/json',
                },
            });

            return workflowsResponse.data.value.map((wf: any) => {
                const result: any = {
                    WorkflowId: wf.workflowid,
                    Name: wf.name,
                    Description: wf.description,
                    PrimaryEntity: wf.primaryentity || 'None (Global)',
                    Category: this.getWorkflowCategoryName(wf.category),
                    CategoryCode: wf.category,
                    Type: this.getWorkflowTypeName(wf.type),
                    State: wf.statecode === 1 ? 'Active' : 'Inactive',
                    Mode: wf.mode === 0 ? 'Background' : 'Real-time',
                    Scope: this.getWorkflowScopeName(wf.scope),
                    CreatedOn: wf.createdon,
                    ModifiedOn: wf.modifiedon,
                };

                // Add trigger info for classic workflows and Power Automate
                if (wf.category === 0 || wf.category === 5) {
                    result.TriggerOnCreate = wf.triggeroncreate;
                    result.TriggerOnUpdate = wf.triggeronupdateattributelist ? true : false;
                    result.TriggerOnDelete = wf.triggerondelete;
                }

                // Try to extract Power Automate flow details from clientdata
                if (wf.category === 5 && wf.clientdata) {
                    try {
                        const clientData = JSON.parse(wf.clientdata);
                        if (clientData.properties) {
                            result.FlowDisplayName = clientData.properties.displayName;
                            result.FlowState = clientData.properties.state;
                            result.FlowCreatedTime = clientData.properties.createdTime;
                            result.FlowLastModifiedTime = clientData.properties.lastModifiedTime;
                            result.FlowEnvironment = clientData.properties.environment?.name;
                        }
                        // Extract trigger type
                        if (clientData.properties?.definition?.triggers) {
                            const triggers = Object.keys(clientData.properties.definition.triggers);
                            result.TriggerTypes = triggers;
                        }
                        // Extract actions
                        if (clientData.properties?.definition?.actions) {
                            const actions = Object.keys(clientData.properties.definition.actions);
                            result.ActionCount = actions.length;
                            result.Actions = actions.slice(0, 10); // First 10 actions
                        }
                    } catch (e) {
                        // clientdata parsing failed, ignore
                    }
                }

                return result;
            });
        } catch (error) {
            console.error('D365 Workflows Fetch Error:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Fetch Power Automate Cloud Flows specifically
     * Includes category 1 (Flow/Power Automate), 5 (Modern Flow), and 6 (Desktop Flow)
     */
    async fetchPowerAutomateFlows(
        accessToken: string,
        organizationUrl: string,
    ): Promise<any[]> {
        try {
            // Power Automate flows can be stored with category 1, 5, or 6
            // category 1 = Flow, category 5 = Modern Flow, category 6 = Desktop Flow
            const url = `${organizationUrl}/api/data/v9.2/workflows?$filter=(category eq 1 or category eq 5 or category eq 6)&$select=workflowid,name,description,primaryentity,category,statecode,createdon,modifiedon,clientdata`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'OData-MaxVersion': '4.0',
                    'OData-Version': '4.0',
                    Accept: 'application/json',
                },
            });

            return response.data.value.map((flow: any) => {
                const flowType = flow.category === 6 ? 'Desktop Flow' : 
                                 flow.category === 5 ? 'Modern Cloud Flow' : 
                                 'Power Automate Cloud Flow';
                const result: any = {
                    FlowId: flow.workflowid,
                    Name: flow.name,
                    Description: flow.description,
                    PrimaryEntity: flow.primaryentity || 'None (Global)',
                    Category: flow.category,
                    State: flow.statecode === 1 ? 'On' : 'Off',
                    CreatedOn: flow.createdon,
                    ModifiedOn: flow.modifiedon,
                    Type: flowType,
                };

                // Parse clientdata for flow definition details
                if (flow.clientdata) {
                    try {
                        const clientData = JSON.parse(flow.clientdata);
                        if (clientData.properties) {
                            result.DisplayName = clientData.properties.displayName || flow.name;
                            result.FlowState = clientData.properties.state;
                            
                            // Get trigger info
                            if (clientData.properties?.definition?.triggers) {
                                const triggers = clientData.properties.definition.triggers;
                                result.Triggers = Object.entries(triggers).map(([name, trigger]: [string, any]) => ({
                                    Name: name,
                                    Type: trigger.type,
                                    Kind: trigger.kind,
                                }));
                            }

                            // Get actions summary
                            if (clientData.properties?.definition?.actions) {
                                const actions = clientData.properties.definition.actions;
                                result.ActionCount = Object.keys(actions).length;
                                result.Actions = Object.entries(actions).slice(0, 15).map(([name, action]: [string, any]) => ({
                                    Name: name,
                                    Type: action.type,
                                }));
                            }

                            // Get connections used
                            if (clientData.properties?.connectionReferences) {
                                result.Connections = Object.entries(clientData.properties.connectionReferences).map(([key, conn]: [string, any]) => ({
                                    Name: key,
                                    Api: conn.api?.name,
                                    ConnectionName: conn.connectionName,
                                }));
                            }
                        }
                    } catch (e) {
                        // Parsing failed, continue with basic info
                    }
                }

                return result;
            });
        } catch (error) {
            console.error('Power Automate Flows Fetch Error:', error.response?.data || error.message);
            return [];
        }
    }

    private getWorkflowCategoryName(category: number): string {
        const categories: Record<number, string> = {
            0: 'Workflow',
            1: 'Flow (Power Automate)',
            2: 'Business Rule',
            3: 'Action',
            4: 'Business Process Flow',
            5: 'Modern Flow (Power Automate)',
            6: 'Desktop Flow',
        };
        return categories[category] || `Unknown (${category})`;
    }

    private getWorkflowTypeName(type: number): string {
        const types: Record<number, string> = {
            1: 'Definition',
            2: 'Activation',
            3: 'Template',
        };
        return types[type] || `Unknown (${type})`;
    }

    private getWorkflowScopeName(scope: number): string {
        const scopes: Record<number, string> = {
            1: 'User',
            2: 'Business Unit',
            3: 'Parent-Child Business Units',
            4: 'Organization',
        };
        return scopes[scope] || `Unknown (${scope})`;
    }
}
