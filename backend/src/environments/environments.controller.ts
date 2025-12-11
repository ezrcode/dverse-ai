import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import {
    CreateEnvironmentDto,
    UpdateEnvironmentDto,
} from './dto/environment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('environments')
@UseGuards(JwtAuthGuard)
export class EnvironmentsController {
    constructor(private readonly environmentsService: EnvironmentsService) { }

    @Post()
    create(@Request() req, @Body() createEnvironmentDto: CreateEnvironmentDto) {
        return this.environmentsService.create(
            req.user.userId,
            createEnvironmentDto,
        );
    }

    @Get()
    findAll(@Request() req) {
        return this.environmentsService.findAll(req.user.userId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.environmentsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(
        @Request() req,
        @Param('id') id: string,
        @Body() updateEnvironmentDto: UpdateEnvironmentDto,
    ) {
        return this.environmentsService.update(
            id,
            req.user.userId,
            updateEnvironmentDto,
        );
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.environmentsService.remove(id, req.user.userId);
    }

    @Post(':id/test')
    testConnection(@Request() req, @Param('id') id: string) {
        return this.environmentsService.testConnection(id, req.user.userId);
    }
}
