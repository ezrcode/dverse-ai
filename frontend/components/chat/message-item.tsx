'use client';

import { Message } from '@/types';
import { format } from 'date-fns';
import { User, Bot, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { hasExportableData, exportToExcel } from '@/lib/excelExport';
import { useI18n } from '@/lib/i18n';

interface MessageItemProps {
    message: Message;
    userProfilePhotoUrl?: string | null;
}

export function MessageItem({ message, userProfilePhotoUrl }: MessageItemProps) {
    const isUser = message.role === 'user';
    const { t } = useI18n();
    const canExport = !isUser && hasExportableData(message.content);

    const handleExport = () => {
        exportToExcel(message.content, 'dverse-respuesta');
    };

    return (
        <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${isUser ? 'bg-[#E5E5E5]' : 'bg-[#FF6B35]'
                }`}>
                {isUser ? (
                    userProfilePhotoUrl ? (
                        <img
                            src={userProfilePhotoUrl}
                            alt="User"
                            className="object-cover w-10 h-10"
                        />
                    ) : (
                        <User className="w-5 h-5 text-[#1B1B1B]" />
                    )
                ) : (
                    <Bot className="w-5 h-5 text-white" />
                )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`rounded-lg px-4 py-3 shadow-sm ${isUser
                        ? 'bg-[#F0F0F0] text-[#1B1B1B]'
                        : 'bg-white text-[#1B1B1B] border border-[#E0E0E0]'
                    }`}>
                    <div className="text-sm break-words prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-code:bg-[#F5F5F5] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[#FF6B35] prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#1A1A1A] prose-pre:text-white prose-pre:rounded-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-2">
                    <span className="text-xs text-[#999999]">
                        {format(new Date(message.createdAt), 'h:mm a')}
                    </span>
                    {canExport && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1 text-xs text-[#FF6B35] hover:text-[#E55A2B] transition-colors"
                            title={t('exportToExcel')}
                        >
                            <Download className="w-3 h-3" />
                            <span>Excel</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
