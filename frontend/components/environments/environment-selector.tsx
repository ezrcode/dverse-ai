'use client';

import { Environment } from '@/types';
import { Check, ChevronsUpDown, Database } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface EnvironmentSelectorProps {
    environments: Environment[];
    selectedId?: string;
    onSelect: (environmentId: string) => void;
}

export function EnvironmentSelector({
    environments,
    selectedId,
    onSelect,
}: EnvironmentSelectorProps) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const selected = environments.find((env) => env.id === selectedId);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected':
                return 'bg-success';
            case 'error':
                return 'bg-error';
            default:
                return 'bg-text-muted';
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md border transition-all duration-200",
                    open
                        ? "border-secondary ring-2 ring-secondary ring-opacity-50"
                        : "border-border hover:border-secondary"
                )}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Database className="w-5 h-5 text-text-secondary flex-shrink-0" />
                    {selected ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(selected.status))} />
                            <span className="text-sm font-medium text-text-primary truncate">
                                {selected.name}
                            </span>
                        </div>
                    ) : (
                        <span className="text-sm text-text-muted">
                            {t('env_selectPlaceholder')}
                        </span>
                    )}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-md shadow-lg z-20 max-h-[300px] overflow-y-auto">
                        {environments.length === 0 ? (
                            <div className="p-4 text-center text-sm text-text-muted">
                                {t('env_noConfigured')}{' '}
                                <a href="/environments/new" className="text-primary hover:text-primary-hover font-medium">
                                    {t('env_addFirst')}
                                </a>
                            </div>
                        ) : (
                            <div className="py-2">
                                {environments.map((env) => (
                                    <button
                                        key={env.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(env.id);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                            env.id === selectedId
                                                ? "bg-primary-light text-primary"
                                                : "hover:bg-surface text-text-primary"
                                        )}
                                    >
                                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(env.status))} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{env.name}</div>
                                            <div className="text-xs text-text-muted truncate">{env.organizationUrl}</div>
                                        </div>
                                        {env.id === selectedId && (
                                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
