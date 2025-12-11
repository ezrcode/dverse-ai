'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from './api';

/**
 * Hook that redirects to login if no auth token is present.
 * Should be called at the top of protected pages.
 */
export function useRequireAuth() {
    const router = useRouter();

    useEffect(() => {
        if (!ApiClient.hasToken()) {
            router.replace('/login');
        }
    }, [router]);

    return ApiClient.hasToken();
}

