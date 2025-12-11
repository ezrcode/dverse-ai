'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClient } from '@/lib/api';
import type { RegisterData, AuthResponse } from '@/types';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<RegisterData>({
        email: '',
        password: '',
        name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Redirect to home if already logged in
        if (ApiClient.hasToken()) {
            router.push('/');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await ApiClient.post<AuthResponse>('/auth/register', formData);
            ApiClient.setToken(response.accessToken);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-white to-secondary-light p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-3 text-center">
                    <Link href="/landing" className="flex items-center justify-center mb-2">
                        <img src="/logo.png" alt="DVerse-ai" className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
                    </Link>
                    <CardTitle className="text-2xl">Create Your Account</CardTitle>
                    <CardDescription>
                        Get started with AI-powered Dataverse analysis
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-accent-light border border-error text-error px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-text-primary">
                                Name
                            </label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-text-primary">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                error={!!error}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-text-primary">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                error={!!error}
                            />
                            <p className="text-xs text-text-muted">
                                Must be at least 6 characters
                            </p>
                        </div>

                        <Button
                            type="submit"
                            variant="accent"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>

                        <div className="text-center text-sm text-text-secondary">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
