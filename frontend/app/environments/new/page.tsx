'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClient } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useI18n } from '@/lib/i18n';
import type { CreateEnvironmentData, Environment, Conversation } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function NewEnvironmentPage() {
    const router = useRouter();
    const { t } = useI18n();
    const isAuthenticated = useRequireAuth();
    const [formData, setFormData] = useState<CreateEnvironmentData>({
        name: '',
        organizationUrl: '',
        clientId: '',
        clientSecret: '',
        tenantId: '',
        description: '',
    });
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await ApiClient.post<Environment>('/environments', formData);
            router.push('/environments');
        } catch (err: any) {
            setError(err.message || 'Failed to create environment');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const convs = await ApiClient.get<Conversation[]>('/conversations');
                setConversations(convs);
            } catch (error: any) {
                if (error.statusCode === 401) {
                    // Clear invalid token to prevent redirect loop
                    ApiClient.removeToken();
                    router.push('/login');
                }
            }
        };
        loadConversations();
    }, [router]);

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen bg-white">
            <Sidebar conversations={conversations} />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-8">
                    <Link href="/environments">
                        <Button variant="ghost" className="mb-6 gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            {t('env_back')}
                        </Button>
                    </Link>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">{t('env_newTitle')}</CardTitle>
                            <CardDescription>
                                {t('env_newSubtitle')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-accent-light border border-error text-error px-4 py-3 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium text-text-primary">
                                        {t('env_name')} <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder={t('env_namePlaceholder')}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="organizationUrl" className="text-sm font-medium text-text-primary">
                                        {t('env_orgUrl')} <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="organizationUrl"
                                        type="url"
                                        placeholder={t('env_orgUrlPlaceholder')}
                                        value={formData.organizationUrl}
                                        onChange={(e) => setFormData({ ...formData, organizationUrl: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="tenantId" className="text-sm font-medium text-text-primary">
                                        {t('env_tenantId')} <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="tenantId"
                                        type="text"
                                        placeholder={t('env_tenantIdPlaceholder')}
                                        value={formData.tenantId}
                                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="clientId" className="text-sm font-medium text-text-primary">
                                        {t('env_clientId')} <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="clientId"
                                        type="text"
                                        placeholder={t('env_clientIdPlaceholder')}
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="clientSecret" className="text-sm font-medium text-text-primary">
                                        {t('env_clientSecret')} <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="clientSecret"
                                        type="password"
                                        placeholder={t('env_clientSecretPlaceholder')}
                                        value={formData.clientSecret}
                                        onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium text-text-primary">
                                        {t('env_description')}
                                    </label>
                                    <textarea
                                        id="description"
                                        placeholder={t('env_descriptionPlaceholder')}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 min-h-[80px]"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        {loading ? t('env_creating') : t('env_create')}
                                    </Button>
                                    <Link href="/environments">
                                        <Button type="button" variant="ghost">
                                            {t('env_cancel')}
                                        </Button>
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="mt-6 p-4 bg-secondary-light rounded-lg">
                        <h3 className="font-semibold text-text-primary mb-2">ℹ️ {t('env_help_title')}</h3>
                        <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
                            <li>{t('env_help_1')}</li>
                            <li>{t('env_help_2')}</li>
                            <li>{t('env_help_3')}</li>
                            <li>{t('env_help_4')}</li>
                            <li>{t('env_help_5')}</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
