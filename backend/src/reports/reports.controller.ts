import {
    Controller,
    Get,
    Query,
    UseGuards,
    Request,
    Res,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    /**
     * Generate and download the Inmuebles-Contacts report as Excel
     * GET /reports/inmuebles-contacts
     */
    @Get('inmuebles-contacts')
    async getInmueblesContactsReport(
        @Request() req: any,
        @Query('environmentIds') environmentIds: string,
        @Res() res: Response,
    ) {
        try {
            const userId = req.user.userId;
            
            // Parse environment IDs if provided
            const envIds = environmentIds 
                ? environmentIds.split(',').map(id => id.trim())
                : undefined;

            console.log(`[Reports] Generating inmuebles-contacts report for user ${userId}`);
            console.log(`[Reports] Environment IDs filter:`, envIds);

            // Generate report data
            const report = await this.reportsService.generateInmuebleContactReport(
                userId,
                envIds,
            );

            console.log(`[Reports] Report generated with ${report.totalRows} rows`);

            // Generate Excel
            const excelBuffer = await this.reportsService.generateExcel(report);

            // Set response headers for file download
            const filename = `inmuebles-contactos-${new Date().toISOString().split('T')[0]}.xlsx`;
            
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': excelBuffer.length,
            });

            res.send(excelBuffer);
        } catch (error) {
            console.error('[Reports] Error generating report:', error);
            throw new HttpException(
                error.message || 'Failed to generate report',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Get report data as JSON (for preview)
     * GET /reports/inmuebles-contacts/preview
     */
    @Get('inmuebles-contacts/preview')
    async getInmueblesContactsPreview(
        @Request() req: any,
        @Query('environmentIds') environmentIds: string,
        @Query('limit') limit: string,
    ) {
        const userId = req.user.userId;
        
        const envIds = environmentIds 
            ? environmentIds.split(',').map(id => id.trim())
            : undefined;

        const report = await this.reportsService.generateInmuebleContactReport(
            userId,
            envIds,
        );

        // Apply limit for preview
        const maxRows = parseInt(limit) || 100;
        
        return {
            ...report,
            rows: report.rows.slice(0, maxRows),
            isPreview: true,
            previewLimit: maxRows,
        };
    }
}
