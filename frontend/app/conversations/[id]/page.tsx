'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { MessageList } from '@/components/chat/message-list';
import { PromptInput } from '@/components/chat/prompt-input';
import { EnvironmentSelector } from '@/components/environments/environment-selector';
import { ApiClient } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useI18n } from '@/lib/i18n';
import type { Environment, Conversation, Message, SendMessageData, ChatResponse, User } from '@/types';
import { Pencil } from 'lucide-react';

export default function ConversationPage() {
    const router = useRouter();
    const params = useParams();
    const conversationId = params.id as string;
    const isAuthenticated = useRequireAuth();
    const { t } = useI18n();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const toAbsolute = (url: string | null) => {
        if (!url) return null;
        // data: URLs (base64) and http URLs are already absolute
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `${API_URL}${url}`;
    };

    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [selectedEnvironmentIds, setSelectedEnvironmentIds] = useState<string[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [renaming, setRenaming] = useState(false);
    const [profile, setProfile] = useState<User | null>(null);

    useEffect(() => {
        loadData();
    }, [conversationId]);

    const loadData = async () => {
        try {
            const [envsData, convsData, convData, profileData] = await Promise.all([
                ApiClient.get<Environment[]>('/environments'),
                ApiClient.get<Conversation[]>('/conversations'),
                ApiClient.get<Conversation>(`/conversations/${conversationId}`),
                ApiClient.get<User>('/auth/profile'),
            ]);

            setEnvironments(envsData);
            setConversations(convsData);
            setCurrentConversation(convData);
            setMessages(convData.messages || []);
            const absPhoto = toAbsolute(profileData.profilePhotoUrl || null);
            setProfile({ ...profileData, profilePhotoUrl: absPhoto });

            // Set the environment from the conversation
            if (convData.environmentId) {
                setSelectedEnvironmentIds([convData.environmentId]);
            } else if (envsData.length > 0) {
                setSelectedEnvironmentIds([envsData[0].id]);
            }
        } catch (error: any) {
            if (error.statusCode === 401) {
                router.push('/login');
            } else if (error.statusCode === 404) {
                router.push('/');
            }
        } finally {
            setInitialLoading(false);
        }
    };

    const handleRename = async () => {
        if (!currentConversation) return;
        const newTitle = prompt(t('sidebar_rename') + ':', currentConversation.title);
        if (!newTitle || newTitle.trim() === '' || newTitle === currentConversation.title) return;
        setRenaming(true);
        try {
            const updated = await ApiClient.patch<Conversation>(`/conversations/${conversationId}`, {
                title: newTitle.trim(),
            });
            setCurrentConversation(updated);
            // Update sidebar list
            const convsData = await ApiClient.get<Conversation[]>('/conversations');
            setConversations(convsData);
        } catch (error: any) {
            alert(error.message || 'No se pudo renombrar la conversación');
        } finally {
            setRenaming(false);
        }
    };

    const handleSendMessage = async (message: string, image?: string) => {
        if (selectedEnvironmentIds.length === 0) {
            alert(t('chat_selectEnvFirst'));
            return;
        }

        // Add user message immediately
        const userMessage: Message = {
            role: 'user',
            content: message,
            metadata: image ? { image } : undefined,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
            const data: SendMessageData = {
                conversationId: conversationId,
                environmentIds: selectedEnvironmentIds,
                message,
                image,
            };

            const response = await ApiClient.post<ChatResponse>('/chat/message', data);

            // Add AI response
            const aiMessage: Message = {
                role: 'assistant',
                content: response.message.content,
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMessage]);

            // Reload conversations to update sidebar
            const convsData = await ApiClient.get<Conversation[]>('/conversations');
            setConversations(convsData);
        } catch (error: any) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get environment names for export
    const getEnvironmentNames = () => {
        const names = environments
            .filter(e => selectedEnvironmentIds.includes(e.id))
            .map(e => e.name);
        return names.length > 0 ? names.join('_vs_') : undefined;
    };

    if (!isAuthenticated) {
        return null;
    }

    if (initialLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-6xl animate-pulse">🔮</div>
                    <div className="text-[#666666]">{t('chat_loading')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar conversations={conversations} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header with Conversation Title and Environment Selector */}
                <div className="border-b border-[#E0E0E0] bg-white pl-14 pr-3 py-3 sm:pl-4 sm:pr-4 sm:py-4 sticky top-0 z-10 flex-shrink-0">
                    <div className="max-w-4xl mx-auto w-full">
                        {currentConversation && (
                            <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                <h1 className="text-base sm:text-lg font-semibold text-[#1B1B1B] truncate flex-1 min-w-0">
                                    {currentConversation.title}
                                </h1>
                                <button
                                    onClick={handleRename}
                                    className="text-[#666666] hover:text-[#0078D4] flex items-center gap-1 text-sm"
                                    disabled={renaming}
                                    title={t('sidebar_rename')}
                                >
                                    <Pencil className="w-4 h-4" />
                                    {renaming ? '...' : t('sidebar_rename')}
                                </button>
                            </div>
                        )}
                        <EnvironmentSelector
                            environments={environments}
                            selectedIds={selectedEnvironmentIds}
                            onSelect={setSelectedEnvironmentIds}
                        />
                    </div>
                </div>

                {/* Messages */}
                <MessageList
                    messages={messages}
                    loading={loading}
                    userProfilePhotoUrl={profile?.profilePhotoUrl || null}
                    environmentName={getEnvironmentNames()}
                />

                {/* Input */}
                <PromptInput
                    onSend={handleSendMessage}
                    disabled={selectedEnvironmentIds.length === 0 || loading}
                />
            </div>
        </div>
    );
}
