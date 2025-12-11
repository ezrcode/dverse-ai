'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface PromptInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function PromptInput({ onSend, disabled }: PromptInputProps) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="border-t border-border bg-white p-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your Dataverse metadata..."
                        disabled={disabled}
                        className="flex-1 resize-none rounded-md border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] max-h-[200px]"
                        rows={1}
                        style={{
                            height: 'auto',
                            minHeight: '56px',
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                        }}
                    />
                    <Button
                        type="submit"
                        variant="accent"
                        size="icon"
                        disabled={!message.trim() || disabled}
                        className="h-14 w-14 flex-shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
                <div className="mt-2 text-xs text-text-muted text-center">
                    {message.length > 0 && `${message.length} characters`}
                </div>
            </form>
        </div>
    );
}
