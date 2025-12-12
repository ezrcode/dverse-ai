'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import { MessageItem } from './message-item';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface MessageListProps {
    messages: Message[];
    loading?: boolean;
    userProfilePhotoUrl?: string | null;
    environmentName?: string;
}

export function MessageList({ messages, loading, userProfilePhotoUrl, environmentName }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useI18n();

    // Scroll to bottom when messages change or loading state changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !loading && (
                <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4 max-w-md">
                        <div className="text-6xl">🔮</div>
                        <h2 className="text-2xl font-semibold text-text-primary">
                            {t('chat_emptyTitle')}
                        </h2>
                        <p className="text-text-secondary">
                            {t('chat_emptySubtitle')}
                        </p>
                    </div>
                </div>
            )}

            {messages.map((message, index) => (
                <MessageItem key={index} message={message} userProfilePhotoUrl={userProfilePhotoUrl} environmentName={environmentName} />
            ))}

            {loading && (
                <div className="flex gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-secondary">
                        <Loader2 className="w-5 h-5 text-text-primary animate-spin" />
                    </div>
                    <div className="flex-1 max-w-[70%]">
                        <div className="rounded-lg px-4 py-3 shadow-sm bg-surface text-text-primary">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse delay-75"></div>
                                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse delay-150"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
        </div>
    );
}
