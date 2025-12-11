const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
    message: string;
    statusCode: number;
}

export class ApiClient {
    private static getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('accessToken');
    }

    private static async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (options.headers) {
            Object.assign(headers, options.headers);
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: isFormData ? (() => {
                // Remove content-type for FormData to allow boundary to be set automatically
                const h = { ...headers };
                delete (h as any)['Content-Type'];
                return h;
            })() : headers,
        });

        const rawText = await response.text();

        if (!response.ok) {
            let error: ApiError = {
                message: 'An error occurred',
                statusCode: response.status,
            };
            try {
                const parsed = rawText ? JSON.parse(rawText) : null;
                if (parsed?.message) {
                    error = parsed;
                }
            } catch (_) {
                // ignore parse errors
            }
            throw error;
        }

        // Handle empty responses (204 or no body)
        if (!rawText) {
            return undefined as T;
        }

        return JSON.parse(rawText) as T;
    }

    static async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    static async post<T>(endpoint: string, data?: any): Promise<T> {
        const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
        return this.request<T>(endpoint, {
            method: 'POST',
            body: isFormData ? data : data ? JSON.stringify(data) : undefined,
        });
    }

    static async patch<T>(endpoint: string, data: any): Promise<T> {
        const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: isFormData ? data : JSON.stringify(data),
        });
    }

    static async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    static setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', token);
        }
    }

    static removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
        }
    }

    static hasToken(): boolean {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('accessToken');
    }
}
