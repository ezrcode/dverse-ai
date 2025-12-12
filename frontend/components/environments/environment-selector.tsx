'use client';

import { Environment } from '@/types';
import { Check, ChevronsUpDown, Database, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface EnvironmentSelectorProps {
    environments: Environment[];
    selectedIds: string[];
    onSelect: (environmentIds: string[]) => void;
}

export function EnvironmentSelector({
    environments,
    selectedIds,
    onSelect,
}: EnvironmentSelectorProps) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    
    const selectedEnvironments = environments.filter((env) => selectedIds.includes(env.id));
    const allSelected = environments.length > 0 && selectedIds.length === environments.length;

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

    const handleToggleEnvironment = (envId: string) => {
        if (selectedIds.includes(envId)) {
            // Remove if already selected (but keep at least one)
            if (selectedIds.length > 1) {
                onSelect(selectedIds.filter(id => id !== envId));
            }
        } else {
            // Add to selection
            onSelect([...selectedIds, envId]);
        }
    };

    const handleSelectAll = () => {
        if (allSelected) {
            // Deselect all except first
            onSelect([environments[0].id]);
        } else {
            // Select all
            onSelect(environments.map(env => env.id));
        }
    };

    const handleRemoveEnvironment = (envId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIds.length > 1) {
            onSelect(selectedIds.filter(id => id !== envId));
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
                    {selectedEnvironments.length > 0 ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                            {selectedEnvironments.length === 1 ? (
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(selectedEnvironments[0].status))} />
                                    <span className="text-sm font-medium text-text-primary truncate">
                                        {selectedEnvironments[0].name}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 flex-wrap">
                                    {selectedEnvironments.slice(0, 3).map((env) => (
                                        <span
                                            key={env.id}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light text-primary text-xs font-medium rounded-full"
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(env.status))} />
                                            {env.name}
                                            <button
                                                onClick={(e) => handleRemoveEnvironment(env.id, e)}
                                                className="hover:text-primary-hover"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {selectedEnvironments.length > 3 && (
                                        <span className="text-xs text-text-muted">
                                            +{selectedEnvironments.length - 3} {t('env_more')}
                                        </span>
                                    )}
                                </div>
                            )}
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
                                {/* Select All Option */}
                                {environments.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border",
                                            allSelected
                                                ? "bg-primary-light text-primary"
                                                : "hover:bg-surface text-text-primary"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                                            allSelected ? "bg-primary border-primary" : "border-text-muted"
                                        )}>
                                            {allSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">{t('env_selectAll')}</div>
                                            <div className="text-xs text-text-muted">{t('env_compareMultiple')}</div>
                                        </div>
                                    </button>
                                )}
                                
                                {/* Environment List */}
                                {environments.map((env) => (
                                    <button
                                        key={env.id}
                                        type="button"
                                        onClick={() => handleToggleEnvironment(env.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                            selectedIds.includes(env.id)
                                                ? "bg-primary-light text-primary"
                                                : "hover:bg-surface text-text-primary"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                                            selectedIds.includes(env.id) ? "bg-primary border-primary" : "border-text-muted"
                                        )}>
                                            {selectedIds.includes(env.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(env.status))} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{env.name}</div>
                                            <div className="text-xs text-text-muted truncate">{env.organizationUrl}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
            
            {/* Multi-environment indicator */}
            {selectedIds.length > 1 && (
                <div className="mt-2 text-xs text-primary flex items-center gap-1">
                    <span>🔄</span>
                    <span>{t('env_comparisonMode')}</span>
                </div>
            )}
        </div>
    );
}
