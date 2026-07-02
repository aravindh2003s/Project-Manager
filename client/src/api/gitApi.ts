// Git API store — all API calls for the git feature
import { API_BASE } from './http';
import { useAuthStore } from '../store/authStore';

const API = `${API_BASE}/git`;

async function authJson<T>(url: string, options: RequestInit = {}) {
    const token = useAuthStore.getState().token;
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || 'Request failed');
    }

    return payload as T;
}

export interface FileTreeItem {
    name: string;
    type: 'file' | 'directory';
    path: string;
    children?: FileTreeItem[];
}

export interface Commit {
    oid: string;
    shortOid: string;
    message: string;
    author: string;
    email: string;
    timestamp: number;
}

export interface RepoInfo {
    isRepo: boolean;
    name: string;
    branch: string;
    commitCount: number;
    latestCommit: { oid: string; message: string; author: string; timestamp: number } | null;
    remotes: { name: string; url: string }[];
}

export interface FileContent {
    content: string;
    language: string;
    size: number;
    path: string;
    tooLarge?: boolean;
}

export interface DiffLine {
    type: 'add' | 'remove' | 'context';
    content: string;
    lineNo?: number;
}

export const gitApi = {
    getInfo: (): Promise<RepoInfo> =>
        authJson(`${API}/info`),

    getTree: (dirPath = '.'): Promise<{ path: string; items: FileTreeItem[] }> =>
        authJson(`${API}/tree?path=${encodeURIComponent(dirPath)}`),

    getFile: (filePath: string): Promise<FileContent> =>
        authJson(`${API}/file?path=${encodeURIComponent(filePath)}`),

    saveFile: (filePath: string, content: string): Promise<{ success: boolean }> =>
        authJson(`${API}/file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath, content }),
        }),

    getCommits: (depth = 30): Promise<Commit[]> =>
        authJson(`${API}/commits?depth=${depth}`),

    getBranches: (): Promise<{ current: string; branches: string[] }> =>
        authJson(`${API}/branches`),

    getDiff: (file: string): Promise<{ file: string; oldOid: string; newOid: string; lines: DiffLine[] }> =>
        authJson(`${API}/diff?file=${encodeURIComponent(file)}`),
};
