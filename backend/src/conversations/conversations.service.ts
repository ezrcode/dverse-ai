import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import {
    CreateConversationDto,
    ConversationResponseDto,
    MessageDto,
    UpdateConversationDto,
} from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
    ) { }

    async create(
        userId: string,
        createConversationDto: CreateConversationDto,
    ): Promise<ConversationResponseDto> {
        const conversation = this.conversationRepository.create({
            userId,
            environmentId: createConversationDto.environmentId,
            title: createConversationDto.title || 'New Conversation',
        });

        const saved = await this.conversationRepository.save(conversation);

        return this.toResponseDto(saved);
    }

    async findAll(userId: string): Promise<ConversationResponseDto[]> {
        const conversations = await this.conversationRepository.find({
            where: { userId },
            relations: ['environment'],
            order: { updatedAt: 'DESC' },
        });

        return conversations.map((conv) => ({
            ...this.toResponseDto(conv),
            environmentName: conv.environment?.name,
        }));
    }

    async findOne(
        id: string,
        userId: string,
    ): Promise<ConversationResponseDto> {
        const conversation = await this.conversationRepository.findOne({
            where: { id, userId },
            relations: ['environment', 'messages'],
        });

        if (!conversation) {
            throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
        }

        const messages: MessageDto[] = conversation.messages
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((msg) => ({
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
            }));

        return {
            ...this.toResponseDto(conversation),
            environmentName: conversation.environment?.name,
            messages,
        };
    }

    async remove(id: string, userId: string): Promise<void> {
        const conversation = await this.conversationRepository.findOne({
            where: { id, userId },
        });

        if (!conversation) {
            throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
        }

        await this.conversationRepository.remove(conversation);
    }

    async addMessage(
        conversationId: string,
        role: string,
        content: string,
        metadata?: Record<string, any>,
    ): Promise<Message> {
        const message = this.messageRepository.create({
            conversationId,
            role,
            content,
            metadata,
        });

        return await this.messageRepository.save(message);
    }

    async updateTitle(
        conversationId: string,
        userId: string,
        title: string,
    ): Promise<void> {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId, userId },
        });

        if (!conversation) {
            throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
        }

        conversation.title = title;
        await this.conversationRepository.save(conversation);
    }

    async update(
        id: string,
        userId: string,
        updateDto: UpdateConversationDto,
    ): Promise<ConversationResponseDto> {
        if (!updateDto.title) {
            throw new HttpException('Nothing to update', HttpStatus.BAD_REQUEST);
        }

        await this.updateTitle(id, userId, updateDto.title);
        return this.findOne(id, userId);
    }

    async getConversationEntity(
        id: string,
        userId: string,
    ): Promise<Conversation> {
        const conversation = await this.conversationRepository.findOne({
            where: { id, userId },
        });

        if (!conversation) {
            throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
        }

        return conversation;
    }

    private toResponseDto(conversation: Conversation): ConversationResponseDto {
        return {
            id: conversation.id,
            title: conversation.title,
            environmentId: conversation.environmentId,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
        };
    }
}
