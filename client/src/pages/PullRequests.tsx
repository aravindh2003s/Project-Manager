import { useState } from 'react';
import {
    GitPullRequest, GitMerge, Search, X, CheckCircle, XCircle,
    ArrowRight, MessageSquare, Plus
} from 'lucide-react';

interface PullRequest {
    id: string;
    title: string;
    number: number;
    status: 'open' | 'merged' | 'closed';
    author: string;
    baseBranch: string;
    headBranch: string;
    reviewStatus: 'approved' | 'pending' | 'changes_requested';
    comments: number;
    checksPass: boolean;
    createdAt: string;
    assigneeInitial: string;
}

const MOCK_PRS: PullRequest[] = [
    { id: '1', title: 'feat: Add drag-and-drop kanban board', number: 42, status: 'open', author: 'Demo User', baseBranch: 'main', headBranch: 'feat/kanban', reviewStatus: 'approved', comments: 5, checksPass: true, createdAt: '2 hours ago', assigneeInitial: 'D' },
    { id: '2', title: 'fix: Resolve task deletion race condition', number: 41, status: 'open', author: 'Demo User', baseBranch: 'main', headBranch: 'fix/delete-race', reviewStatus: 'pending', comments: 2, checksPass: true, createdAt: '5 hours ago', assigneeInitial: 'D' },
    { id: '3', title: 'feat: Implement global search with Cmd+K', number: 40, status: 'merged', author: 'Demo User', baseBranch: 'main', headBranch: 'feat/search', reviewStatus: 'approved', comments: 8, checksPass: true, createdAt: '1 day ago', assigneeInitial: 'D' },
    { id: '4', title: 'chore: Update dependencies and fix security vulnerabilities', number: 39, status: 'merged', author: 'Demo User', baseBranch: 'main', headBranch: 'chore/deps', reviewStatus: 'approved', comments: 1, checksPass: true, createdAt: '2 days ago', assigneeInitial: 'D' },
    { id: '5', title: 'feat: Add CI/CD pipeline visualization', number: 38, status: 'open', author: 'Demo User', baseBranch: 'main', headBranch: 'feat/pipelines', reviewStatus: 'changes_requested', comments: 12, checksPass: false, createdAt: '3 days ago', assigneeInitial: 'D' },
    { id: '6', title: 'refactor: Migrate store to Zustand v5', number: 37, status: 'closed', author: 'Demo User', baseBranch: 'main', headBranch: 'refactor/zustand', reviewStatus: 'pending', comments: 3, checksPass: true, createdAt: '5 days ago', assigneeInitial: 'D' },
    { id: '7', title: 'fix: Sprint date calculation timezone issue', number: 36, status: 'merged', author: 'Demo User', baseBranch: 'main', headBranch: 'fix/timezone', reviewStatus: 'approved', comments: 0, checksPass: true, createdAt: '1 week ago', assigneeInitial: 'D' },
];

const REVIEW_MAP: Record<string, { label: string; className: string }> = {
    approved: { label: 'Approved', className: 'pr-review-approved' },
    pending: { label: 'Review pending', className: 'pr-review-pending' },
    changes_requested: { label: 'Changes requested', className: 'pr-review-changes' },
};

export default function PullRequests() {
    const [tab, setTab] = useState<'open' | 'closed'>('open');
    const [search, setSearch] = useState('');

    const openPRs = MOCK_PRS.filter(pr => pr.status === 'open');
    const closedPRs = MOCK_PRS.filter(pr => pr.status !== 'open');

    const currentList = tab === 'open' ? openPRs : closedPRs;

    const filtered = currentList.filter(pr =>
        !search || pr.title.toLowerCase().includes(search.toLowerCase()) || pr.headBranch.includes(search.toLowerCase())
    );

    return (
        <div className="pulls-page">
            <div className="pulls-header">
                <h1>Pull Requests</h1>
                <button className="btn btn-primary" id="newPRBtn" title="New Pull Request">
                    <Plus size={16} /> New Pull Request
                </button>
            </div>

            <div className="issues-tabs">
                <button className={`tab-item ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>
                    <GitPullRequest size={14} /> {openPRs.length} Open
                </button>
                <button className={`tab-item ${tab === 'closed' ? 'active' : ''}`} onClick={() => setTab('closed')}>
                    <CheckCircle size={14} /> {closedPRs.length} Closed
                </button>
            </div>

            <div className="issues-toolbar">
                <div className="issues-search-bar">
                    <Search size={14} />
                    <input
                        id="prSearch"
                        type="text"
                        placeholder="Search pull requests…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="issues-search-input"
                    />
                    {search && (
                        <button className="dash-search-clear" title="Clear" onClick={() => setSearch('')}>
                            <X size={12} />
                        </button>
                    )}
                </div>
                <span className="issues-count">{filtered.length} results</span>
            </div>

            <div className="issues-list">
                <div className="issues-list-header">
                    <span><GitPullRequest size={12} /> {filtered.length} {tab}</span>
                </div>
                {filtered.length === 0 && <div className="issues-empty">No pull requests found.</div>}
                {filtered.map(pr => (
                    <div key={pr.id} className="pr-row">
                        <div className={`pr-icon ${pr.status === 'open' ? 'pr-icon-open' : pr.status === 'merged' ? 'pr-icon-merged' : 'pr-icon-closed'}`}>
                            {pr.status === 'merged' ? <GitMerge size={16} /> : pr.status === 'closed' ? <XCircle size={16} /> : <GitPullRequest size={16} />}
                        </div>
                        <div className="pr-body">
                            <div>
                                <span className="pr-title-link">{pr.title}</span>
                                <span className="pr-branches">
                                    <span className="pr-branch">{pr.headBranch}</span>
                                    <ArrowRight size={10} className="pr-arrow" />
                                    <span className="pr-branch">{pr.baseBranch}</span>
                                </span>
                            </div>
                            <div className="pr-meta">
                                <span>#{pr.number} opened {pr.createdAt} by {pr.author}</span>
                                <span className="pr-checks">
                                    {pr.checksPass ? <CheckCircle size={12} className="pr-check-pass" /> : <XCircle size={12} className="pr-check-fail" />}
                                    {pr.checksPass ? 'Checks pass' : 'Checks failing'}
                                </span>
                            </div>
                        </div>
                        <div className="pr-right">
                            <span className={`pr-review-status ${REVIEW_MAP[pr.reviewStatus].className}`}>
                                {REVIEW_MAP[pr.reviewStatus].label}
                            </span>
                            {pr.comments > 0 && (
                                <span className="issue-comments"><MessageSquare size={12} /> {pr.comments}</span>
                            )}
                            <div className="issue-assignee">{pr.assigneeInitial}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
