'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClient } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useI18n } from '@/lib/i18n';
import type { Environment, UpdateEnvironmentData, Conversation } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function EditEnvironmentPage() {
    const router = useRouter();
    const { t } = useI18n();
    const params = useParams();
    const id = params?.id?.toString();
    const isAuthenticated = useRequireAuth();

    const [formData, setFormData] = useState({
        name: '',
        organizationUrl: '',
        clientId: '',
        clientSecret: '',
        tenantId: '',
        description: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [conversations, setConversations] = useState<Conversation[]>([]);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const env = await ApiClient.get<Environment>(`/environments/${id}`);
                setFormData({
                    name: env.name ?? '',
                    organizationUrl: env.organizationUrl ?? '',
                    clientId: env.clientId ?? '',
                    clientSecret: '',
                    tenantId: env.tenantId ?? '',
                    description: env.description ?? '',
                });
            } catch (err: any) {
                setError(err.message || 'No se pudo cargar el entorno');
            } finally {
                setLoading(false);
            }
        };
        const loadConversations = async () => {
            try {
                const convs = await ApiClient.get<Conversation[]>('/conversations');
                setConversations(convs);
            } catch (err: any) {
                if (err.statusCode === 401) {
                    // Clear invalid token to prevent redirect loop
                    ApiClient.removeToken();
                    router.push('/login');
                }
            }
        };
        load();
        loadConversations();
    }, [id, router]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setError('');
        setSaving(true);

        const payload: UpdateEnvironmentData = {
            name: formData.name.trim(),
            organizationUrl: formData.organizationUrl.trim(),
            clientId: formData.clientId.trim(),
            tenantId: formData.tenantId.trim(),
            description: formData.description,
        };

        if (formData.clientSecret.trim()) {
            payload.clientSecret = formData.clientSecret.trim();
        }

        try {
            await ApiClient.patch<Environment>(`/environments/${id}`, payload);
            router.push('/environments');
        } catch (err: any) {
            setError(err.message || 'No se pudo actualizar el entorno');
        } finally {
            setSaving(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex h-screen bg-white">
                <Sidebar />
                <div className="flex-1 p-8">{t('env_loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white">
            <Sidebar conversations={conversations} />
            <div className="flex-1 p-8 bg-gradient-to-br from-[#f3f6fb] to-white overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/environments" className="hover:text-[#0078D4]">
                            {t('sidebar_environments')}
                        </Link>
                        <span>/</span>
                        <span className="font-medium text-gray-900">{t('env_edit')}</span>
                    </div>

                    <Card className="shadow-lg border border-gray-100">
                        <CardHeader className="space-y-1">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    asChild
                                >
                                    <Link href="/environments">
                                        <ArrowLeft className="w-4 h-4" />
                                    </Link>
                                </Button>
                                <div>
                                    <CardTitle className="text-2xl text-gray-900">
                                        {t('env_editTitle')}
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        {t('env_editSubtitle')}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            {t('env_name')}
                                        </label>
                                        <Input
                                            required
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder={t('env_namePlaceholder')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            {t('env_orgUrl')}
                                        </label>
                                        <Input
                                            required
                                            type="url"
                                            value={formData.organizationUrl}
                                            onChange={(e) =>
                                                handleChange('organizationUrl', e.target.value)
                                            }
                                            placeholder={t('env_orgUrlPlaceholder')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            {t('env_clientId')}
                                        </label>
                                        <Input
                                            required
                                            value={formData.clientId}
                                            onChange={(e) => handleChange('clientId', e.target.value)}
                                            placeholder={t('env_clientIdPlaceholder')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            {t('env_clientSecret')} ({t('env_clientSecretHint')})
                                        </label>
                                        <Input
                                            type="password"
                                            value={formData.clientSecret}
                                            onChange={(e) =>
                                                handleChange('clientSecret', e.target.value)
                                            }
                                            placeholder="••••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            {t('env_tenantId')}
                                        </label>
                                        <Input
                                            required
                                            value={formData.tenantId}
                                            onChange={(e) => handleChange('tenantId', e.target.value)}
                                            placeholder={t('env_tenantIdPlaceholder')}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            {t('env_description')}
                                        </label>
                                        <Input
                                            value={formData.description}
                                            onChange={(e) =>
                                                handleChange('description', e.target.value)
                                            }
                                            placeholder={t('env_descriptionPlaceholder')}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" type="button" asChild>
                                        <Link href="/environments">{t('env_cancel')}</Link>
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving ? t('env_saving') : t('env_save')}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

