import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto, UpdateConversationDto } from './dto/conversation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
    constructor(
        private readonly conversationsService: ConversationsService,
    ) { }

    @Post()
    create(@Request() req, @Body() createConversationDto: CreateConversationDto) {
        return this.conversationsService.create(
            req.user.userId,
            createConversationDto,
        );
    }

    @Get()
    findAll(@Request() req) {
        return this.conversationsService.findAll(req.user.userId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.conversationsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    updateTitle(
        @Request() req,
        @Param('id') id: string,
        @Body() updateDto: UpdateConversationDto,
    ) {
        return this.conversationsService.update(id, req.user.userId, updateDto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.conversationsService.remove(id, req.user.userId);
    }
}
