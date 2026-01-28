import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { EnvironmentsService } from '../environments/environments.service';
import { DataverseService } from '../dataverse/dataverse.service';
import { InmuebleContactReportRow, ReportResult } from './dto/reports.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
    constructor(
        private environmentsService: EnvironmentsService,
        private dataverseService: DataverseService,
    ) {}

    /**
     * Generate the Inmuebles-Contacts report across all user environments
     */
    async generateInmuebleContactReport(
        userId: string,
        environmentIds?: string[],
    ): Promise<ReportResult> {
        // Get user's environments (with full entity including secrets for auth)
        let environments = await this.environmentsService.findAllEntities(userId);
        
        if (environmentIds && environmentIds.length > 0) {
            environments = environments.filter(env => environmentIds.includes(env.id));
        }

        if (environments.length === 0) {
            throw new HttpException(
                'No environments configured',
                HttpStatus.BAD_REQUEST,
            );
        }

        const allRows: InmuebleContactReportRow[] = [];
        const environmentNames: string[] = [];

        for (const environment of environments) {
            try {
                console.log(`[Report] Processing environment: ${environment.name}`);
                environmentNames.push(environment.name);

                // Authenticate with D365
                const accessToken = await this.dataverseService.authenticate(environment);

                // Fetch opportunities with related contacts and inmuebles
                const rows = await this.fetchOpportunitiesWithRelations(
                    accessToken,
                    environment.organizationUrl,
                    environment.name,
                );

                allRows.push(...rows);
                console.log(`[Report] Found ${rows.length} rows in ${environment.name}`);
            } catch (error) {
                console.error(`[Report] Error processing ${environment.name}:`, error.message);
                // Continue with other environments
            }
        }

        return {
            rows: allRows,
            generatedAt: new Date().toISOString(),
            environments: environmentNames,
            totalRows: allRows.length,
        };
    }

    /**
     * Fetch opportunities with expanded contact and inmueble data
     */
    private async fetchOpportunitiesWithRelations(
        accessToken: string,
        organizationUrl: string,
        environmentName: string,
    ): Promise<InmuebleContactReportRow[]> {
        const rows: InmuebleContactReportRow[] = [];

        try {
            // First, let's discover the actual field names by fetching entity metadata
            const fieldMappings = await this.discoverFieldMappings(accessToken, organizationUrl);
            
            console.log('[Report] Field mappings discovered:', fieldMappings);

            // Build OData query for opportunities
            // We'll fetch opportunities and then expand to get contact and inmueble info
            const opportunitiesUrl = `${organizationUrl}/api/data/v9.2/opportunities?$top=5000`;

            const response = await fetch(opportunitiesUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'OData-MaxVersion': '4.0',
                    'OData-Version': '4.0',
                    'Accept': 'application/json',
                    'Prefer': 'odata.include-annotations="*"',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
            }

            const data = await response.json();
            const opportunities = data.value || [];

            console.log(`[Report] Found ${opportunities.length} opportunities`);

            // For each opportunity, fetch related contact and inmueble
            for (const opp of opportunities) {
                try {
                    const row = await this.buildReportRow(
                        accessToken,
                        organizationUrl,
                        opp,
                        fieldMappings,
                        environmentName,
                    );
                    if (row) {
                        rows.push(row);
                    }
                } catch (rowError) {
                    console.error('[Report] Error building row:', rowError.message);
                }
            }
        } catch (error) {
            console.error('[Report] Error fetching opportunities:', error.message);
            throw error;
        }

        return rows;
    }

    /**
     * Discover the actual field names in the environment
     */
    private async discoverFieldMappings(
        accessToken: string,
        organizationUrl: string,
    ): Promise<Record<string, any>> {
        const mappings: Record<string, any> = {
            contact: {},
            opportunity: {},
            inmueble: {},
        };

        // Common field name patterns to look for
        const contactFieldPatterns = {
            fullName: ['fullname', 'dec_fullname', 'new_fullname'],
            email: ['emailaddress1', 'emailaddress', 'dec_email', 'new_email'],
            birthDate: ['birthdate', 'dec_birthdate', 'new_birthdate', 'dec_fechanacimiento'],
            nationality: ['dec_nationality', 'new_nationality', 'dec_nacionalidad', 'nationality'],
            residence: ['address1_city', 'dec_residence', 'dec_residencia', 'dec_lugarresidencia', 'new_residence'],
            incomeLevel: ['dec_incomelevel', 'dec_nivelingresos', 'dec_ingresos', 'new_incomelevel', 'revenue'],
            leadSource: ['leadsourcecode', 'dec_leadsource', 'dec_origenleads', 'new_leadsource'],
        };

        const opportunityFieldPatterns = {
            projectName: ['name', 'dec_project', 'dec_proyecto', 'new_project'],
            inmuebleCode: ['dec_inmueble', 'dec_inmuebleid', 'new_inmueble', 'dec_codigoinmueble'],
            inmuebleLookup: ['dec_inmuebleid', 'dec_inmueble', 'new_inmuebleid'],
        };

        const inmuebleFieldPatterns = {
            bedrooms: ['dec_bedrooms', 'dec_habitaciones', 'new_bedrooms', 'dec_canthabitaciones'],
            bathrooms: ['dec_bathrooms', 'dec_banos', 'new_bathrooms', 'dec_cantbanos'],
            status: ['statecode', 'dec_status', 'dec_estado', 'statuscode', 'dec_estadoinmueble'],
            code: ['dec_name', 'dec_codigo', 'new_codigo', 'dec_codigoinmueble'],
        };

        try {
            // Fetch contact attributes
            const contactAttrs = await this.fetchEntityAttributes(accessToken, organizationUrl, 'contact');
            mappings.contact = this.matchFieldPatterns(contactAttrs, contactFieldPatterns);

            // Fetch opportunity attributes
            const oppAttrs = await this.fetchEntityAttributes(accessToken, organizationUrl, 'opportunity');
            mappings.opportunity = this.matchFieldPatterns(oppAttrs, opportunityFieldPatterns);

            // Try to find dec_inmuebles entity
            const inmuebleEntityNames = ['dec_inmueble', 'dec_inmuebles', 'new_inmueble', 'new_inmuebles'];
            for (const entityName of inmuebleEntityNames) {
                try {
                    const inmuebleAttrs = await this.fetchEntityAttributes(accessToken, organizationUrl, entityName);
                    if (inmuebleAttrs.length > 0) {
                        mappings.inmueble.entityName = entityName;
                        mappings.inmueble.fields = this.matchFieldPatterns(inmuebleAttrs, inmuebleFieldPatterns);
                        break;
                    }
                } catch {
                    // Entity doesn't exist, try next
                }
            }
        } catch (error) {
            console.error('[Report] Error discovering field mappings:', error.message);
        }

        return mappings;
    }

    /**
     * Fetch entity attributes
     */
    private async fetchEntityAttributes(
        accessToken: string,
        organizationUrl: string,
        entityLogicalName: string,
    ): Promise<string[]> {
        const url = `${organizationUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes?$select=LogicalName`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch attributes for ${entityLogicalName}`);
        }

        const data = await response.json();
        return (data.value || []).map((attr: any) => attr.LogicalName);
    }

    /**
     * Match field patterns to actual field names
     */
    private matchFieldPatterns(
        availableFields: string[],
        patterns: Record<string, string[]>,
    ): Record<string, string | null> {
        const result: Record<string, string | null> = {};

        for (const [fieldKey, fieldPatterns] of Object.entries(patterns)) {
            result[fieldKey] = null;
            for (const pattern of fieldPatterns) {
                if (availableFields.includes(pattern)) {
                    result[fieldKey] = pattern;
                    break;
                }
            }
        }

        return result;
    }

    /**
     * Build a report row from opportunity data
     */
    private async buildReportRow(
        accessToken: string,
        organizationUrl: string,
        opportunity: any,
        fieldMappings: Record<string, any>,
        environmentName: string,
    ): Promise<InmuebleContactReportRow | null> {
        // Get contact ID from opportunity
        const contactId = opportunity._parentcontactid_value || opportunity._customerid_value;
        
        let contact: any = null;
        if (contactId) {
            contact = await this.fetchRecord(accessToken, organizationUrl, 'contacts', contactId);
        }

        // Get inmueble ID from opportunity (if available)
        let inmueble: any = null;
        const inmuebleLookupField = fieldMappings.opportunity?.inmuebleLookup;
        if (inmuebleLookupField && opportunity[`_${inmuebleLookupField}_value`]) {
            const inmuebleId = opportunity[`_${inmuebleLookupField}_value`];
            const inmuebleEntityName = fieldMappings.inmueble?.entityName;
            if (inmuebleEntityName) {
                inmueble = await this.fetchRecord(
                    accessToken, 
                    organizationUrl, 
                    `${inmuebleEntityName}s`, // Pluralize
                    inmuebleId
                );
            }
        }

        // Build the row
        const cm = fieldMappings.contact || {};
        const om = fieldMappings.opportunity || {};
        const im = fieldMappings.inmueble?.fields || {};

        return {
            // Contact fields
            fullName: contact?.[cm.fullName] || contact?.fullname || '',
            email: contact?.[cm.email] || contact?.emailaddress1 || '',
            birthDate: this.formatDate(contact?.[cm.birthDate] || contact?.birthdate),
            nationality: contact?.[cm.nationality] || null,
            residence: contact?.[cm.residence] || contact?.address1_city || null,
            incomeLevel: contact?.[cm.incomeLevel] || null,
            leadSource: this.getFormattedValue(contact, cm.leadSource) || 
                        this.getFormattedValue(contact, 'leadsourcecode') || null,

            // Opportunity fields
            projectName: opportunity?.[om.projectName] || opportunity?.name || null,
            inmuebleCode: inmueble?.[im.code] || 
                          opportunity?.[`_${om.inmuebleLookup}_value@OData.Community.Display.V1.FormattedValue`] ||
                          null,

            // Inmueble fields
            bedrooms: inmueble?.[im.bedrooms] || null,
            bathrooms: inmueble?.[im.bathrooms] || null,
            inmuebleStatus: this.getFormattedValue(inmueble, im.status) ||
                           this.getFormattedValue(inmueble, 'statecode') || null,

            // Metadata
            environmentName,
        };
    }

    /**
     * Fetch a single record by ID
     */
    private async fetchRecord(
        accessToken: string,
        organizationUrl: string,
        entitySetName: string,
        recordId: string,
    ): Promise<any | null> {
        try {
            const url = `${organizationUrl}/api/data/v9.2/${entitySetName}(${recordId})`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'OData-MaxVersion': '4.0',
                    'OData-Version': '4.0',
                    'Accept': 'application/json',
                    'Prefer': 'odata.include-annotations="*"',
                },
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch {
            return null;
        }
    }

    /**
     * Get formatted value from OData annotations
     */
    private getFormattedValue(record: any, fieldName: string | null): string | null {
        if (!record || !fieldName) return null;
        return record[`${fieldName}@OData.Community.Display.V1.FormattedValue`] || 
               record[fieldName] || 
               null;
    }

    /**
     * Format date to readable string
     */
    private formatDate(dateValue: any): string | null {
        if (!dateValue) return null;
        try {
            const date = new Date(dateValue);
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
        } catch {
            return null;
        }
    }

    /**
     * Generate Excel file from report data
     */
    async generateExcel(report: ReportResult): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'DVerse-AI';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Inmuebles y Contactos');

        // Define columns
        worksheet.columns = [
            { header: 'Nombre Completo', key: 'fullName', width: 30 },
            { header: 'Correo Electrónico', key: 'email', width: 35 },
            { header: 'Fecha de Nacimiento', key: 'birthDate', width: 18 },
            { header: 'Nacionalidad', key: 'nationality', width: 20 },
            { header: 'Lugar de Residencia', key: 'residence', width: 25 },
            { header: 'Nivel de Ingresos', key: 'incomeLevel', width: 20 },
            { header: 'Origen del Lead', key: 'leadSource', width: 20 },
            { header: 'Proyecto', key: 'projectName', width: 30 },
            { header: 'Inmueble', key: 'inmuebleCode', width: 15 },
            { header: 'Habitaciones', key: 'bedrooms', width: 12 },
            { header: 'Baños', key: 'bathrooms', width: 10 },
            { header: 'Estado Inmueble', key: 'inmuebleStatus', width: 18 },
            { header: 'Entorno', key: 'environmentName', width: 25 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Add data rows
        for (const row of report.rows) {
            worksheet.addRow(row);
        }

        // Auto-filter
        worksheet.autoFilter = {
            from: 'A1',
            to: `M${report.rows.length + 1}`,
        };

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
