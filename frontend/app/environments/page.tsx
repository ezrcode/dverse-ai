'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClient } from '@/lib/api';
import type { Environment, Conversation } from '@/types';
import { Database, Plus, Trash2, Edit, TestTube } from 'lucide-react';
import { format } from 'date-fns';

export default function EnvironmentsPage() {
    const router = useRouter();
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [testingId, setTestingId] = useState<string | null>(null);

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
            await loadEnvironments(); // Reload to get updated status
        } catch (error: any) {
            alert('Failed to test connection');
        } finally {
            setTestingId(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
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
                return <span className="badge-connected">Connected</span>;
            case 'error':
                return <span className="badge-disconnected">Error</span>;
            default:
                return <span className="badge-info">Not Tested</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-text-secondary">Loading environments...</div>
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
                            <h1 className="text-3xl font-bold text-text-primary">Environments</h1>
                            <p className="text-text-secondary mt-2">
                                Manage your Dynamics 365 / Dataverse connections
                            </p>
                        </div>
                        <Link href="/environments/new">
                            <Button variant="accent" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Environment
                            </Button>
                        </Link>
                    </div>

                    {environments.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <Database className="w-16 h-16 text-text-muted mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-text-primary mb-2">
                                    No environments yet
                                </h3>
                                <p className="text-text-secondary mb-6">
                                    Add your first Dynamics 365 environment to get started
                                </p>
                                <Link href="/environments/new">
                                    <Button variant="primary">Add Environment</Button>
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
                                                {testingId === env.id ? 'Testing...' : 'Test'}
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
