import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../api/http';

export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    bio?: string | null;
    website?: string | null;
    location?: string | null;
    theme: string;
    language: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    twoFactorEnabled: boolean;
}

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    hydrated: boolean;
    login: (payload: { email: string; password: string }) => Promise<void>;
    register: (payload: { name: string; email: string; password: string }) => Promise<void>;
    fetchMe: () => Promise<void>;
    updateProfile: (payload: Partial<AuthUser>) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            loading: false,
            error: null,
            hydrated: false,

            async login(payload) {
                set({ loading: true, error: null });
                try {
                    const result = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', { method: 'POST' }, payload);
                    set({ token: result.token, user: result.user, loading: false });
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Failed to sign in', loading: false });
                    throw error;
                }
            },

            async register(payload) {
                set({ loading: true, error: null });
                try {
                    const result = await apiFetch<{ token: string; user: AuthUser }>('/auth/register', { method: 'POST' }, payload);
                    set({ token: result.token, user: result.user, loading: false });
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Failed to create account', loading: false });
                    throw error;
                }
            },

            async fetchMe() {
                if (!useAuthStore.getState().token) {
                    set({ user: null, loading: false });
                    return;
                }

                set({ loading: true, error: null });
                try {
                    const result = await apiFetch<{ user: AuthUser }>('/auth/me');
                    set({ user: result.user, loading: false });
                } catch (error) {
                    set({
                        token: null,
                        user: null,
                        loading: false,
                        error: error instanceof Error ? error.message : 'Session expired',
                    });
                }
            },

            async updateProfile(payload) {
                set({ loading: true, error: null });
                try {
                    const result = await apiFetch<{ user: AuthUser }>('/auth/me', { method: 'PATCH' }, payload as Record<string, unknown>);
                    set({ user: result.user, loading: false });
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Failed to update profile', loading: false });
                    throw error;
                }
            },

            async logout() {
                try {
                    if (useAuthStore.getState().token) {
                        await apiFetch('/auth/logout', { method: 'POST' });
                    }
                } finally {
                    set({ token: null, user: null, loading: false, error: null });
                }
            },

            clearError() {
                set({ error: null });
            },

            markHydrated() {
                set({ hydrated: true });
            },
        }),
        {
            name: 'nexus-auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.markHydrated();
            },
        }
    )
);
