export const GITHUB_API_URL = 'https://api.github.com';

export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    state: string;
    html_url: string;
    created_at: string;
    user: {
        login: string;
        avatar_url: string;
    };
    comments: number;
    labels: Array<{ name: string; color: string }>;
    pull_request?: any;
}

export interface GitHubPullRequest {
    id: number;
    number: number;
    title: string;
    state: string;
    html_url: string;
    created_at: string;
    user: {
        login: string;
        avatar_url: string;
    };
    head: { ref: string };
    base: { ref: string };
    draft: boolean;
}

export interface GitHubActionRun {
    id: number;
    name: string;
    head_branch: string;
    head_commit: { message: string };
    status: string;
    conclusion: string | null;
    html_url: string;
    created_at: string;
    updated_at: string;
    actor: {
        login: string;
        avatar_url: string;
    };
}

export async function fetchGithubIssues(repo: string): Promise<GitHubIssue[]> {
    const res = await fetch(`${GITHUB_API_URL}/repos/${repo}/issues?per_page=50`);
    if (!res.ok) throw new Error('Failed to fetch issues');
    const data = await res.json();
    return data.filter((item: any) => !item.pull_request);
}

export async function fetchGithubPullRequests(repo: string): Promise<GitHubPullRequest[]> {
    const res = await fetch(`${GITHUB_API_URL}/repos/${repo}/pulls?per_page=50`);
    if (!res.ok) throw new Error('Failed to fetch pull requests');
    return res.json();
}

export async function fetchGithubActionRuns(repo: string): Promise<GitHubActionRun[]> {
    const res = await fetch(`${GITHUB_API_URL}/repos/${repo}/actions/runs?per_page=50`);
    if (!res.ok) throw new Error('Failed to fetch action runs');
    const data = await res.json();
    return data.workflow_runs || [];
}

export async function fetchGithubDiscussionsMock(repo: string): Promise<GitHubIssue[]> {
    const res = await fetch(`${GITHUB_API_URL}/search/issues?q=repo:${repo}+type:issue&sort=comments&order=desc&per_page=20`);
    if (!res.ok) throw new Error('Failed to fetch discussions');
    const data = await res.json();
    return data.items || [];
}
