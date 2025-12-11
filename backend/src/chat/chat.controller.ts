import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('message')
    sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
        return this.chatService.sendMessage(req.user.userId, sendMessageDto);
    }
}
