import { IsOptional, IsArray, IsString } from 'class-validator';

export class GenerateReportDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    environmentIds?: string[];
}

export interface InmuebleContactReportRow {
    // Contact fields
    fullName: string;
    email: string;
    birthDate: string | null;
    nationality: string | null;
    residence: string | null;
    incomeLevel: string | null;
    leadSource: string | null;
    
    // Opportunity fields
    projectName: string | null;
    inmuebleCode: string | null;
    
    // Inmueble fields
    bedrooms: number | null;
    bathrooms: number | null;
    inmuebleStatus: string | null;
    
    // Metadata
    environmentName: string;
}

export interface ReportResult {
    rows: InmuebleContactReportRow[];
    generatedAt: string;
    environments: string[];
    totalRows: number;
}
