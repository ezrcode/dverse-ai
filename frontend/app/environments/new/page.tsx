'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClient } from '@/lib/api';
import type { CreateEnvironmentData, Environment, Conversation } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function NewEnvironmentPage() {
    const router = useRouter();
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
                    router.push('/login');
                }
            }
        };
        loadConversations();
    }, [router]);

    return (
        <div className="flex h-screen bg-white">
            <Sidebar conversations={conversations} />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-8">
                    <Link href="/environments">
                        <Button variant="ghost" className="mb-6 gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Environments
                        </Button>
                    </Link>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Add New Environment</CardTitle>
                            <CardDescription>
                                Configure a new Dynamics 365 / Dataverse environment connection
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
                                        Environment Name <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Production Environment"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-text-muted">
                                        A friendly name to identify this environment
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="organizationUrl" className="text-sm font-medium text-text-primary">
                                        Organization URL <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="organizationUrl"
                                        type="url"
                                        placeholder="https://yourorg.crm.dynamics.com"
                                        value={formData.organizationUrl}
                                        onChange={(e) => setFormData({ ...formData, organizationUrl: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-text-muted">
                                        Your Dynamics 365 organization URL
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="tenantId" className="text-sm font-medium text-text-primary">
                                        Tenant ID <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="tenantId"
                                        type="text"
                                        placeholder="00000000-0000-0000-0000-000000000000"
                                        value={formData.tenantId}
                                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-text-muted">
                                        Azure AD Tenant ID
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="clientId" className="text-sm font-medium text-text-primary">
                                        Client ID <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="clientId"
                                        type="text"
                                        placeholder="00000000-0000-0000-0000-000000000000"
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-text-muted">
                                        Application (client) ID from Azure AD app registration
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="clientSecret" className="text-sm font-medium text-text-primary">
                                        Client Secret <span className="text-error">*</span>
                                    </label>
                                    <Input
                                        id="clientSecret"
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={formData.clientSecret}
                                        onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-text-muted">
                                        Client secret value (will be encrypted)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium text-text-primary">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        placeholder="Optional description for this environment"
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
                                        {loading ? 'Creating...' : 'Create Environment'}
                                    </Button>
                                    <Link href="/environments">
                                        <Button type="button" variant="ghost">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="mt-6 p-4 bg-secondary-light rounded-lg">
                        <h3 className="font-semibold text-text-primary mb-2">ℹ️ How to get these credentials</h3>
                        <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
                            <li>Go to Azure Portal → Azure Active Directory → App registrations</li>
                            <li>Create a new app registration or select an existing one</li>
                            <li>Copy the Application (client) ID and Directory (tenant) ID</li>
                            <li>Go to Certificates & secrets → Create a new client secret</li>
                            <li>Grant API permissions for Dynamics CRM (user_impersonation)</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
