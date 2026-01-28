'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClient } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import type { UserSettings, UpdateSettingsData, Conversation } from '@/types';
import { Settings, Key, Sparkles, Check, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const isAuthenticated = useRequireAuth();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [useFreeTier, setUseFreeTier] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);

    useEffect(() => {
        loadSettings();
        loadConversations();
    }, []);

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

    const loadSettings = async () => {
        try {
            const data = await ApiClient.get<UserSettings>('/auth/settings');
            setSettings(data);
            setUseFreeTier(data.useFreeTier);
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

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const updateData: UpdateSettingsData = {
                useFreeTier,
            };

            // Only include API key if it's being changed
            if (apiKey) {
                updateData.geminiApiKey = apiKey;
            }

            const updated = await ApiClient.post<UserSettings>('/auth/settings', updateData);
            setSettings(updated);
            setApiKey(''); // Clear the input after saving
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleClearApiKey = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const updated = await ApiClient.post<UserSettings>('/auth/settings', {
                geminiApiKey: '',
                useFreeTier: true,
            });
            setSettings(updated);
            setUseFreeTier(true);
            setApiKey('');
            setMessage({ type: 'success', text: 'API key removed successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to remove API key' });
        } finally {
            setSaving(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar conversations={conversations} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-[#666666]">Loading settings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white">
            <Sidebar />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto p-8">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Settings className="w-8 h-8 text-[#FF6B35]" />
                            <h1 className="text-3xl font-bold text-[#1B1B1B]">Settings</h1>
                        </div>
                        <p className="text-[#666666]">
                            Configure your AI and application preferences
                        </p>
                    </div>

                    {message && (
                        <div
                            className={`mb-6 p-4 rounded-lg ${
                                message.type === 'success'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#FF6B35]" />
                                <CardTitle>Gemini AI Configuration</CardTitle>
                            </div>
                            <CardDescription>
                                Choose how to connect to Google Gemini AI for analyzing your Dataverse data
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Option 1: Free Tier */}
                            <div
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    useFreeTier
                                        ? 'border-[#FF6B35] bg-orange-50'
                                        : 'border-[#E0E0E0] hover:border-[#999999]'
                                }`}
                                onClick={() => setUseFreeTier(true)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                useFreeTier
                                                    ? 'border-[#FF6B35] bg-[#FF6B35]'
                                                    : 'border-[#999999]'
                                            }`}
                                        >
                                            {useFreeTier && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[#1B1B1B]">Use Free Tier (Default)</h3>
                                            <p className="text-sm text-[#666666]">
                                                Use the application's shared Gemini API key
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                                        FREE
                                    </span>
                                </div>
                            </div>

                            {/* Option 2: Own API Key */}
                            <div
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    !useFreeTier
                                        ? 'border-[#FF6B35] bg-orange-50'
                                        : 'border-[#E0E0E0] hover:border-[#999999]'
                                }`}
                                onClick={() => setUseFreeTier(false)}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            !useFreeTier
                                                ? 'border-[#FF6B35] bg-[#FF6B35]'
                                                : 'border-[#999999]'
                                        }`}
                                    >
                                        {!useFreeTier && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#1B1B1B]">Use Your Own API Key</h3>
                                        <p className="text-sm text-[#666666]">
                                            Provide your personal Gemini API key for unlimited usage
                                        </p>
                                    </div>
                                </div>

                                {!useFreeTier && (
                                    <div className="ml-8 space-y-4">
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                                            <Input
                                                type={showApiKey ? 'text' : 'password'}
                                                placeholder={
                                                    settings?.hasGeminiApiKey
                                                        ? '••••••••••••••••••• (key saved)'
                                                        : 'Enter your Gemini API key'
                                                }
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                className="pl-10 pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#666666]"
                                            >
                                                {showApiKey ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>

                                        {settings?.hasGeminiApiKey && (
                                            <button
                                                type="button"
                                                onClick={handleClearApiKey}
                                                className="text-sm text-red-600 hover:text-red-700 underline"
                                            >
                                                Remove saved API key
                                            </button>
                                        )}

                                        <p className="text-xs text-[#999999]">
                                            Get your API key from{' '}
                                            <a
                                                href="https://makersuite.google.com/app/apikey"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#0078D4] hover:underline"
                                            >
                                                Google AI Studio
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} variant="primary">
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

