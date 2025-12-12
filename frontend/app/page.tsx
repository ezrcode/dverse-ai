'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { MessageList } from '@/components/chat/message-list';
import { PromptInput } from '@/components/chat/prompt-input';
import { EnvironmentSelector } from '@/components/environments/environment-selector';
import { ApiClient } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useI18n } from '@/lib/i18n';
import type { Environment, Conversation, Message, SendMessageData, ChatResponse, User } from '@/types';

export default function HomePage() {
  const router = useRouter();
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
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [envsData, convsData, profileData] = await Promise.all([
        ApiClient.get<Environment[]>('/environments'),
        ApiClient.get<Conversation[]>('/conversations'),
        ApiClient.get<User>('/auth/profile'),
      ]);
      setEnvironments(envsData);
      setConversations(convsData);
      const absPhoto = toAbsolute(profileData.profilePhotoUrl || null);
      setProfile({ ...profileData, profilePhotoUrl: absPhoto });

      // Auto-select first environment if available
      if (envsData.length > 0 && !selectedEnvironmentId) {
        setSelectedEnvironmentId(envsData[0].id);
      }
    } catch (error: any) {
      if (error.statusCode === 401) {
        router.push('/login');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedEnvironmentId) {
      alert(t('chat_selectEnvFirst'));
      return;
    }

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data: SendMessageData = {
        conversationId: currentConversationId || undefined,
        environmentId: selectedEnvironmentId,
        message,
      };

      const response = await ApiClient.post<ChatResponse>('/chat/message', data);

      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: response.message.content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update conversation ID if new
      if (!currentConversationId) {
        setCurrentConversationId(response.conversationId);
        // Reload conversations to show the new one
        const convsData = await ApiClient.get<Conversation[]>('/conversations');
        setConversations(convsData);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId('');
    setMessages([]);
  };

  // Don't render anything while checking auth
  if (!isAuthenticated) {
    return null;
  }

  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse">🔮</div>
          <div className="text-text-secondary">{t('chat_loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar conversations={conversations} />

      <div className="flex-1 flex flex-col">
        {/* Header with Environment Selector */}
        <div className="border-b border-border bg-white p-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <EnvironmentSelector
              environments={environments}
              selectedId={selectedEnvironmentId}
              onSelect={setSelectedEnvironmentId}
            />
            {environments.length === 0 && (
              <div className="mt-3 text-sm text-text-secondary text-center">
                {t('env_noConfigured')}{' '}
                <a href="/environments/new" className="text-primary hover:text-primary-hover font-medium">
                  {t('env_configureFirst')}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <MessageList 
          messages={messages} 
          loading={loading} 
          userProfilePhotoUrl={profile?.profilePhotoUrl || null} 
          environmentName={environments.find(e => e.id === selectedEnvironmentId)?.name}
        />

        {/* Input */}
        <PromptInput
          onSend={handleSendMessage}
          disabled={!selectedEnvironmentId || loading}
        />
      </div>
    </div>
  );
}
