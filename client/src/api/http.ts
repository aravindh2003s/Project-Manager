import { useAuthStore } from '../store/authStore';

export const API_BASE = 'http://localhost:3000/api';

type JsonBody = Record<string, unknown> | undefined;

export async function apiFetch<T>(path: string, options: RequestInit = {}, body?: JsonBody): Promise<T> {
    const token = useAuthStore.getState().token;
    const headers = new Headers(options.headers);

    if (body !== undefined && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        body: body !== undefined ? JSON.stringify(body) : options.body,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || 'Request failed');
    }

    return payload as T;
}
