'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClient } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useI18n } from '@/lib/i18n';
import type { Environment, Conversation } from '@/types';
import { Database, Plus, Trash2, Edit, TestTube, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

export default function EnvironmentsPage() {
    const router = useRouter();
    const { t } = useI18n();
    const isAuthenticated = useRequireAuth();
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            const data = await ApiClient.get<Environment[]>('/environments');
            setEnvironments(data);
            const convs = await ApiClient.get<Conversation[]>('/conversations');
            setConversations(convs);
        } catch (error: any) {
            if (error.statusCode === 401) {
                // Clear invalid token to prevent redirect loop
                ApiClient.removeToken();
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async (id: string) => {
        setTestingId(id);
        try {
            const result = await ApiClient.post<{ success: boolean; message: string }>(
                `/environments/${id}/test`
            );
            alert(result.message);
            await loadAll(); // Reload to get updated status
        } catch (error: any) {
            alert('Failed to test connection');
        } finally {
            setTestingId(null);
        }
    };

    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch(`${API_URL}/reports/inmuebles-contacts`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            // Get the blob from response
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inmuebles-contactos-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            alert(error.message || 'Error generando reporte');
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${t('env_confirmDelete')} "${name}"?`)) {
            return;
        }

        try {
            await ApiClient.delete(`/environments/${id}`);
            setEnvironments(environments.filter((env) => env.id !== id));
        } catch (error) {
            alert('Failed to delete environment');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
                return <span className="badge-connected">{t('env_connected')}</span>;
            case 'error':
                return <span className="badge-disconnected">{t('env_error')}</span>;
            default:
                return <span className="badge-info">{t('env_disconnected')}</span>;
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-text-secondary">{t('env_loadingList')}</div>
                </div>
            </div>
        );
    }

    return (
            <div className="flex h-screen bg-white">
            <Sidebar conversations={conversations} />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">{t('env_title')}</h1>
                            <p className="text-text-secondary mt-2">
                                {t('env_subtitle')}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                className="gap-2"
                                onClick={handleGenerateReport}
                                disabled={generatingReport || environments.length === 0}
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                {generatingReport ? 'Generando...' : 'Reporte Excel'}
                            </Button>
                            <Link href="/environments/new">
                                <Button variant="accent" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    {t('env_addNew')}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {environments.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <Database className="w-16 h-16 text-text-muted mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-text-primary mb-2">
                                    {t('env_noEnvs')}
                                </h3>
                                <p className="text-text-secondary mb-6">
                                    {t('env_noEnvsDesc')}
                                </p>
                                <Link href="/environments/new">
                                    <Button variant="primary">{t('env_addFirst')}</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {environments.map((env) => (
                                <Card key={env.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="truncate">{env.name}</CardTitle>
                                                <CardDescription className="truncate mt-1">
                                                    {env.organizationUrl}
                                                </CardDescription>
                                            </div>
                                            <div className="ml-2">{getStatusBadge(env.status)}</div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-between">
                                        <div className="space-y-2 text-sm text-text-secondary mb-4">
                                            {env.description && (
                                                <p className="line-clamp-2">{env.description}</p>
                                            )}
                                            <div>
                                                <span className="font-medium">Tenant ID:</span>{' '}
                                                <span className="font-mono text-xs">{env.tenantId.substring(0, 8)}...</span>
                                            </div>
                                            {env.lastSyncAt && (
                                                <div>
                                                    <span className="font-medium">Last sync:</span>{' '}
                                                    {format(new Date(env.lastSyncAt), 'MMM d, yyyy h:mm a')}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTestConnection(env.id)}
                                                disabled={testingId === env.id}
                                                className="flex-1"
                                            >
                                                <TestTube className="w-4 h-4 mr-2" />
                                                {testingId === env.id ? t('env_testing') : t('env_testConnection')}
                                            </Button>
                                            <Link href={`/environments/${env.id}/edit`}>
                                                <Button variant="outline" size="sm">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(env.id, env.name)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
