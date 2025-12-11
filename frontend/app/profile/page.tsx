'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClient } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import type { User, Conversation } from '@/types';
import { User as UserIcon, Globe, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function ProfilePage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const toAbsolute = (url: string | null) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `${API_URL}${url}`;
    };
    const router = useRouter();
    const isAuthenticated = useRequireAuth();
    const { t, lang, setLang } = useI18n();
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [language, setLanguage] = useState<'es' | 'en'>('es');
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profile, convs] = await Promise.all([
                ApiClient.get<User>('/auth/profile'),
                ApiClient.get<Conversation[]>('/conversations'),
            ]);
            const absPhoto = toAbsolute(profile.profilePhotoUrl || null);
            setUser({ ...profile, profilePhotoUrl: absPhoto });
            setName(profile.name || '');
            setLanguage((profile.language as 'es' | 'en') || 'es');
            setPhotoUrl(absPhoto);
            setConversations(convs);
        } catch (error: any) {
            if (error.statusCode === 401) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const resp = await ApiClient.post<{ url: string }>('/auth/profile/photo', formData);
            const absUrl = toAbsolute(resp.url);
            setPhotoUrl(absUrl);
            setPreview(URL.createObjectURL(file));
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'No se pudo subir la foto' });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const updated = await ApiClient.patch<User>('/auth/profile', {
                name,
                profilePhotoUrl: photoUrl,
                language,
            });
            const absPhoto = toAbsolute(updated.profilePhotoUrl || null);
            setUser({ ...updated, profilePhotoUrl: absPhoto });
            // Sync local state with saved values
            setPhotoUrl(absPhoto);
            setPreview(null); // Clear preview, use saved URL
            setMessage({ type: 'success', text: 'Perfil actualizado' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'No se pudo guardar' });
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
                    <div className="text-[#666666]">Cargando perfil...</div>
                </div>
            </div>
        );
    }

    return (
            <div className="flex h-screen bg-white">
            <Sidebar conversations={conversations} />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <UserIcon className="w-8 h-8 text-[#FF6B35]" />
                        <div>
                            <h1 className="text-3xl font-bold text-[#1B1B1B]">{lang === 'es' ? 'Perfil' : 'Profile'}</h1>
                            <p className="text-[#666666]">{lang === 'es' ? 'Actualiza tu foto, nombre e idioma' : 'Update your photo, name and language'}</p>
                        </div>
                    </div>

                    {message && (
                        <div
                            className={`p-4 rounded-lg ${
                                message.type === 'success'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>{lang === 'es' ? 'Datos de perfil' : 'Profile data'}</CardTitle>
                            <CardDescription>{lang === 'es' ? 'Estos datos se usan en la aplicación' : 'These data are used in the app'}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-[#F0F0F0] overflow-hidden flex items-center justify-center border border-[#E0E0E0]">
                                    {preview || photoUrl ? (
                                        <img
                                            src={preview || photoUrl || ''}
                                            alt="Profile"
                                            className="object-cover w-16 h-16"
                                        />
                                    ) : (
                                        <UserIcon className="w-8 h-8 text-[#999999]" />
                                    )}
                                </div>
                                <label className="flex items-center gap-2 px-3 py-2 border border-[#E0E0E0] rounded-md text-sm cursor-pointer hover:bg-[#F5F5F5]">
                                    <Upload className="w-4 h-4" />
                                    {lang === 'es' ? 'Subir foto' : 'Upload photo'}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#1B1B1B]">{lang === 'es' ? 'Nombre' : 'Name'}</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={lang === 'es' ? 'Tu nombre' : 'Your name'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#1B1B1B]">{lang === 'es' ? 'Idioma' : 'Language'}</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setLanguage('es')}
                                        onMouseDown={() => setLang('es')}
                                        className={`px-3 py-2 rounded-md border ${language === 'es' ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-[#E0E0E0] text-[#666666]'}`}
                                    >
                                        {lang === 'es' ? 'Español (default)' : 'Spanish (default)'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLanguage('en')}
                                        onMouseDown={() => setLang('en')}
                                        className={`px-3 py-2 rounded-md border ${language === 'en' ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-[#E0E0E0] text-[#666666]'}`}
                                    >
                                        {lang === 'es' ? 'Inglés' : 'English'}
                                    </button>
                                    <Globe className="w-5 h-5 text-[#999999]" />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? (lang === 'es' ? 'Guardando...' : 'Saving...') : (lang === 'es' ? 'Guardar cambios' : 'Save changes')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

