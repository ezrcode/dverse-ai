import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Res,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QueryDesignerService } from './query-designer.service';
import {
    ExecuteQueryDto,
    CreateSavedQueryDto,
    UpdateSavedQueryDto,
} from './dto/query-designer.dto';

@Controller('query-designer')
@UseGuards(JwtAuthGuard)
export class QueryDesignerController {
    constructor(private readonly queryDesignerService: QueryDesignerService) {}

    // ============== Metadata Endpoints ==============

    /**
     * Get all entities for an environment
     * GET /query-designer/environments/:environmentId/entities
     */
    @Get('environments/:environmentId/entities')
    async getEntities(
        @Request() req: any,
        @Param('environmentId') environmentId: string,
    ) {
        return this.queryDesignerService.getEntities(req.user.userId, environmentId);
    }

    /**
     * Get attributes for an entity
     * GET /query-designer/environments/:environmentId/entities/:entityName/attributes
     */
    @Get('environments/:environmentId/entities/:entityName/attributes')
    async getEntityAttributes(
        @Request() req: any,
        @Param('environmentId') environmentId: string,
        @Param('entityName') entityName: string,
    ) {
        return this.queryDesignerService.getEntityAttributes(
            req.user.userId,
            environmentId,
            entityName,
        );
    }

    /**
     * Get relationships for an entity
     * GET /query-designer/environments/:environmentId/entities/:entityName/relationships
     */
    @Get('environments/:environmentId/entities/:entityName/relationships')
    async getEntityRelationships(
        @Request() req: any,
        @Param('environmentId') environmentId: string,
        @Param('entityName') entityName: string,
    ) {
        return this.queryDesignerService.getEntityRelationships(
            req.user.userId,
            environmentId,
            entityName,
        );
    }

    // ============== Query Execution Endpoints ==============

    /**
     * Execute a query
     * POST /query-designer/execute
     */
    @Post('execute')
    async executeQuery(
        @Request() req: any,
        @Body() dto: ExecuteQueryDto,
    ) {
        return this.queryDesignerService.executeQuery(
            req.user.userId,
            dto.query,
            dto.page || 1,
            dto.pageSize || 50,
            dto.countOnly || false,
        );
    }

    /**
     * Export query results to Excel
     * POST /query-designer/export
     */
    @Post('export')
    async exportQuery(
        @Request() req: any,
        @Body() dto: ExecuteQueryDto,
        @Res() res: Response,
    ) {
        try {
            const buffer = await this.queryDesignerService.exportToExcel(
                req.user.userId,
                dto.query,
            );

            const filename = `query-export-${new Date().toISOString().split('T')[0]}.xlsx`;

            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length,
            });

            res.send(buffer);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to export query',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // ============== Saved Query Endpoints ==============

    /**
     * Get all saved queries
     * GET /query-designer/saved
     */
    @Get('saved')
    async getSavedQueries(@Request() req: any) {
        return this.queryDesignerService.getSavedQueries(req.user.userId);
    }

    /**
     * Get a specific saved query
     * GET /query-designer/saved/:id
     */
    @Get('saved/:id')
    async getSavedQuery(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        return this.queryDesignerService.getSavedQuery(id, req.user.userId);
    }

    /**
     * Create a new saved query
     * POST /query-designer/saved
     */
    @Post('saved')
    async createSavedQuery(
        @Request() req: any,
        @Body() dto: CreateSavedQueryDto,
    ) {
        return this.queryDesignerService.createSavedQuery(req.user.userId, dto);
    }

    /**
     * Update a saved query
     * PATCH /query-designer/saved/:id
     */
    @Patch('saved/:id')
    async updateSavedQuery(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateSavedQueryDto,
    ) {
        return this.queryDesignerService.updateSavedQuery(id, req.user.userId, dto);
    }

    /**
     * Delete a saved query
     * DELETE /query-designer/saved/:id
     */
    @Delete('saved/:id')
    async deleteSavedQuery(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        await this.queryDesignerService.deleteSavedQuery(id, req.user.userId);
        return { success: true };
    }
}
