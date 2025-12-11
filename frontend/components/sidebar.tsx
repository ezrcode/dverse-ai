'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    MessageSquare,
    Database,
    Settings,
    User,
    LogOut,
    Plus,
    FolderOpen,
    Trash2,
    Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface SidebarProps {
    conversations?: Array<{
        id: string;
        title: string;
        createdAt: string;
    }>;
}

export function Sidebar({ conversations = [] }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { t, lang, setLang } = useI18n();

    const handleLogout = () => {
        ApiClient.removeToken();
        router.push('/login');
    };

    const handleRenameConversation = async (id: string, currentTitle: string) => {
        const newTitle = prompt('New conversation title:', currentTitle);
        if (!newTitle || newTitle.trim() === '' || newTitle === currentTitle) return;
        try {
            await ApiClient.patch(`/conversations/${id}`, { title: newTitle.trim() });
            if (pathname === `/conversations/${id}`) {
                // Force reload to update the open conversation title
                router.refresh();
            } else {
                router.refresh();
            }
            // Ensure sidebar updates
            window.location.reload();
        } catch (error: any) {
            alert(error.message || 'Failed to rename conversation');
        }
    };

    const handleNewChat = () => {
        router.push('/');
    };

    const handleDeleteConversation = async (id: string) => {
        const confirmDelete = confirm('Are you sure you want to delete this conversation?');
        if (!confirmDelete) return;
        try {
            await ApiClient.delete(`/conversations/${id}`);
            // If you're on the deleted conversation, go home
            if (pathname === `/conversations/${id}`) {
                router.push('/');
            } else {
                router.refresh();
            }
            // Force reload to update client-side lists everywhere
            window.location.reload();
        } catch (error: any) {
            alert(error.message || 'Failed to delete conversation');
        }
    };

    const isActive = (path: string) => pathname === path;

    // Group conversations by date
    const groupedConversations = conversations.reduce((acc, conv) => {
        const date = new Date(conv.createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        let group = 'Older';
        if (date.toDateString() === today.toDateString()) {
            group = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            group = 'Yesterday';
        } else if (date > lastWeek) {
            group = 'Last 7 days';
        }

        if (!acc[group]) acc[group] = [];
        acc[group].push(conv);
        return acc;
    }, {} as Record<string, typeof conversations>);

    return (
        <div className="w-[280px] h-screen bg-white border-r border-border flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border flex flex-col items-center justify-center gap-3 text-center">
                <Link href="/landing" className="flex items-center justify-center">
                    <img
                        src="/logo.png"
                        alt="DVerse-ai"
                        className="h-10 w-auto"
                    />
                </Link>
                <a
                    href="https://own.page/ezrcode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-text-secondary hover:text-primary transition-colors"
                >
                    by @ezrcode
                </a>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
                <Button
                    variant="accent"
                    className="w-full justify-start gap-2"
                    onClick={handleNewChat}
                >
                    <Plus className="w-4 h-4" />
                    {t('sidebar_newChat')}
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 space-y-6">
                {/* Environments Section */}
                <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2">
                        {t('sidebar_environments')}
                    </div>
                    <nav className="space-y-1">
                        <Link
                            href="/environments"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                isActive('/environments')
                                    ? "bg-primary-light text-primary border-l-4 border-primary"
                                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                            )}
                        >
                            <Database className="w-4 h-4" />
                            {t('sidebar_allEnvs')}
                        </Link>
                        <Link
                            href="/environments/new"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-primary hover:bg-primary-light"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                            {t('sidebar_addEnv')}
                        </Link>
                    </nav>
                </div>

                {/* Conversations Section */}
                <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2">
                        {t('sidebar_conversations')}
                    </div>
                    <nav className="space-y-3">
                        {Object.entries(groupedConversations).map(([group, convs]) => (
                            <div key={group}>
                                <div className="text-xs text-text-muted px-2 mb-1 flex items-center gap-2">
                                    {group}
                                    <span className="bg-secondary text-text-primary px-2 py-0.5 rounded-full text-xs">
                                        {convs.length}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {convs.map((conv) => (
                                        <div key={conv.id} className="flex items-center gap-2 group">
                                            <Link
                                                href={`/conversations/${conv.id}`}
                                                className={cn(
                                                    "flex flex-1 items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors truncate",
                                                    isActive(`/conversations/${conv.id}`)
                                                        ? "bg-primary-light text-primary border-l-4 border-primary"
                                                        : "text-text-secondary hover:bg-surface hover:text-text-primary"
                                                )}
                                            >
                                                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{conv.title}</span>
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRenameConversation(conv.id, conv.title);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-primary"
                                                title="Rename conversation"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteConversation(conv.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-error"
                                                title={t('sidebar_delete')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {conversations.length === 0 && (
                            <div className="text-sm text-text-muted px-2 py-4 text-center">
                                No conversations yet
                            </div>
                        )}
                    </nav>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-1">
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive('/settings')
                            ? "bg-primary-light text-primary"
                            : "text-text-secondary hover:bg-surface hover:text-text-primary"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    {t('sidebar_settings')}
                </Link>
                <Link
                    href="/profile"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive('/profile')
                            ? "bg-primary-light text-primary"
                            : "text-text-secondary hover:bg-surface hover:text-text-primary"
                    )}
                >
                    <User className="w-4 h-4" />
                    {t('sidebar_profile')}
                </Link>

                {/* Language toggle */}
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary">
                    <span className="text-xs">🌐</span>
                    <button
                        onClick={() => setLang('es')}
                        className={cn(
                            "px-2 py-1 rounded border text-xs",
                            lang === 'es' ? "border-primary text-primary" : "border-border hover:bg-surface"
                        )}
                    >
                        {t('sidebar_lang_es')}
                    </button>
                    <button
                        onClick={() => setLang('en')}
                        className={cn(
                            "px-2 py-1 rounded border text-xs",
                            lang === 'en' ? "border-primary text-primary" : "border-border hover:bg-surface"
                        )}
                    >
                        {t('sidebar_lang_en')}
                    </button>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-text-secondary hover:bg-accent-light hover:text-error w-full"
                >
                    <LogOut className="w-4 h-4" />
                    {t('sidebar_logout')}
                </button>
            </div>
        </div>
    );
}
