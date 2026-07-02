import { useState } from 'react';
import {
    CheckCircle, XCircle, Clock, Search, X, Timer,
    PlayCircle, SkipForward, RefreshCw
} from 'lucide-react';

interface WorkflowRun {
    id: string;
    title: string;
    commitMsg: string;
    workflow: string;
    branch: string;
    status: 'success' | 'failure' | 'running' | 'skipped';
    duration: string;
    time: string;
    actor: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
    success: <CheckCircle size={16} />,
    failure: <XCircle size={16} />,
    running: <RefreshCw size={16} />,
    skipped: <SkipForward size={16} />,
};

const STATUS_CLASS: Record<string, string> = {
    success: 'action-status-success',
    failure: 'action-status-failure',
    running: 'action-status-running',
    skipped: 'action-status-skipped',
};

const MOCK_RUNS: WorkflowRun[] = [
    { id: '1', title: 'Build and Test', commitMsg: 'feat: Add kanban board drag-and-drop', workflow: 'CI', branch: 'feat/kanban', status: 'success', duration: '2m 34s', time: '10 minutes ago', actor: 'Demo User' },
    { id: '2', title: 'Deploy to Staging', commitMsg: 'feat: Add kanban board drag-and-drop', workflow: 'CD', branch: 'feat/kanban', status: 'success', duration: '4m 12s', time: '8 minutes ago', actor: 'Demo User' },
    { id: '3', title: 'E2E Tests', commitMsg: 'fix: Resolve task deletion race condition', workflow: 'CI', branch: 'fix/delete-race', status: 'failure', duration: '5m 01s', time: '1 hour ago', actor: 'Demo User' },
    { id: '4', title: 'Deploy to Production', commitMsg: 'chore: Update dependencies', workflow: 'CD', branch: 'main', status: 'running', duration: '—', time: 'just now', actor: 'Demo User' },
    { id: '5', title: 'Lint and Type Check', commitMsg: 'refactor: Migrate store to Zustand v5', workflow: 'CI', branch: 'refactor/zustand', status: 'success', duration: '1m 22s', time: '3 hours ago', actor: 'Demo User' },
    { id: '6', title: 'Build and Test', commitMsg: 'docs: Update README with setup instructions', workflow: 'CI', branch: 'docs/readme', status: 'success', duration: '2m 10s', time: '5 hours ago', actor: 'Demo User' },
    { id: '7', title: 'Security Scan', commitMsg: 'chore: Update dependencies', workflow: 'Security', branch: 'main', status: 'success', duration: '3m 45s', time: '6 hours ago', actor: 'Demo User' },
    { id: '8', title: 'Code Coverage', commitMsg: 'feat: Implement global search', workflow: 'CI', branch: 'feat/search', status: 'skipped', duration: '—', time: '1 day ago', actor: 'Demo User' },
    { id: '9', title: 'Deploy to Staging', commitMsg: 'fix: Sprint date calculation timezone issue', workflow: 'CD', branch: 'fix/timezone', status: 'success', duration: '3m 55s', time: '2 days ago', actor: 'Demo User' },
    { id: '10', title: 'Build and Test', commitMsg: 'feat: Add sprint planning view', workflow: 'CI', branch: 'feat/sprints', status: 'success', duration: '2m 48s', time: '3 days ago', actor: 'Demo User' },
];

export default function Actions() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = MOCK_RUNS
        .filter(run => {
            const matchesSearch = !search ||
                run.title.toLowerCase().includes(search.toLowerCase()) ||
                run.commitMsg.toLowerCase().includes(search.toLowerCase()) ||
                run.branch.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

    const statusCounts = {
        success: MOCK_RUNS.filter(r => r.status === 'success').length,
        failure: MOCK_RUNS.filter(r => r.status === 'failure').length,
        running: MOCK_RUNS.filter(r => r.status === 'running').length,
    };

    return (
        <div className="actions-page">
            <div className="actions-header">
                <h1>Actions</h1>
                <button className="btn btn-primary" id="runWorkflowBtn" title="Run workflow">
                    <PlayCircle size={16} /> Run Workflow
                </button>
            </div>

            <div className="actions-toolbar">
                <div className="actions-search-bar">
                    <Search size={14} />
                    <input
                        id="actionsSearch"
                        type="text"
                        placeholder="Filter workflow runs…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="actions-search-input"
                    />
                    {search && (
                        <button className="dash-search-clear" title="Clear" onClick={() => setSearch('')}>
                            <X size={12} />
                        </button>
                    )}
                </div>
                <div className="actions-status-filters">
                    <button className={`pd-filter-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
                        All
                    </button>
                    <button className={`pd-filter-chip ${statusFilter === 'success' ? 'active' : ''}`} onClick={() => setStatusFilter('success')}>
                        <CheckCircle size={10} /> {statusCounts.success} Success
                    </button>
                    <button className={`pd-filter-chip ${statusFilter === 'failure' ? 'active' : ''}`} onClick={() => setStatusFilter('failure')}>
                        <XCircle size={10} /> {statusCounts.failure} Failed
                    </button>
                    <button className={`pd-filter-chip ${statusFilter === 'running' ? 'active' : ''}`} onClick={() => setStatusFilter('running')}>
                        <Clock size={10} /> {statusCounts.running} Running
                    </button>
                </div>
            </div>

            <div className="actions-list">
                <div className="actions-list-header">
                    <span>{filtered.length} workflow runs</span>
                </div>
                {filtered.length === 0 && <div className="issues-empty">No workflow runs match your filters.</div>}
                {filtered.map(run => (
                    <div key={run.id} className="action-row">
                        <div className={`action-status-icon ${STATUS_CLASS[run.status]}`}>
                            {STATUS_ICON[run.status]}
                        </div>
                        <div className="action-body">
                            <div className="action-title">{run.title}</div>
                            <div className="action-commit-msg">{run.commitMsg}</div>
                        </div>
                        <div className="action-right">
                            <span className="action-workflow">{run.workflow}</span>
                            <span className="action-branch">{run.branch}</span>
                            <span className="action-duration"><Timer size={12} /> {run.duration}</span>
                            <span className="action-time">{run.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
