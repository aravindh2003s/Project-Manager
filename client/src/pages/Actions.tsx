import { useState, useEffect } from 'react';
import {
    CheckCircle, XCircle, Clock, Search, X, Circle,
    PlayCircle, SkipForward, RefreshCw, Loader
} from 'lucide-react';
import { fetchGithubActionRuns } from '../api/github';
import type { GitHubActionRun } from '../api/github';

const STATUS_ICON: Record<string, React.ReactNode> = {
    success: <CheckCircle size={16} />,
    failure: <XCircle size={16} />,
    in_progress: <RefreshCw size={16} />,
    queued: <Clock size={16} />,
    skipped: <SkipForward size={16} />,
    neutral: <CheckCircle size={16} />
};

const STATUS_CLASS: Record<string, string> = {
    success: 'action-status-success',
    failure: 'action-status-failure',
    in_progress: 'action-status-running',
    queued: 'action-status-skipped',
    skipped: 'action-status-skipped',
    neutral: 'action-status-success'
};

export default function Actions() {
    const [repo, setRepo] = useState('facebook/react');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [runs, setRuns] = useState<GitHubActionRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchGithubActionRuns(repo);
                setRuns(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        const debounce = setTimeout(load, 500);
        return () => clearTimeout(debounce);
    }, [repo]);

    const getStatusStr = (run: GitHubActionRun) => run.conclusion || run.status;

    const filtered = runs.filter(run => {
        const matchesSearch = !search ||
            run.name.toLowerCase().includes(search.toLowerCase()) ||
            run.head_commit.message.toLowerCase().includes(search.toLowerCase()) ||
            run.head_branch.toLowerCase().includes(search.toLowerCase());
        const s = getStatusStr(run);
        const matchesStatus = statusFilter === 'all' || s === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        success: runs.filter(r => getStatusStr(r) === 'success').length,
        failure: runs.filter(r => getStatusStr(r) === 'failure').length,
        running: runs.filter(r => getStatusStr(r) === 'in_progress').length,
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'recently';
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    };

    return (
        <div className="actions-page">
            <div className="actions-header">
                <div>
                    <h1>Actions</h1>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Repository:</span>
                        <input 
                            value={repo} 
                            onChange={e => setRepo(e.target.value)} 
                            className="dash-search-input" 
                            style={{ padding: '4px 8px', width: 200, fontSize: 13 }}
                        />
                    </div>
                </div>
                <button className="btn btn-primary" id="runWorkflowBtn" title="Run workflow" onClick={() => window.open(`https://github.com/${repo}/actions`, '_blank')}>
                    <PlayCircle size={16} /> GitHub Actions
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
                    <button className={`pd-filter-chip ${statusFilter === 'in_progress' ? 'active' : ''}`} onClick={() => setStatusFilter('in_progress')}>
                        <RefreshCw size={10} /> {statusCounts.running} Running
                    </button>
                </div>
            </div>

            {error && <div className="dash-error">{error}</div>}

            {loading ? (
                <div className="dash-loading" style={{ marginTop: 20 }}>
                    <Loader className="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div className="actions-list">
                    <div className="actions-list-header">
                        <span>{filtered.length} workflow runs</span>
                    </div>
                    {filtered.length === 0 && <div className="issues-empty">No workflow runs match your filters.</div>}
                    {filtered.map(run => {
                        const s = getStatusStr(run);
                        return (
                            <div key={run.id} className="action-row" onClick={() => window.open(run.html_url, '_blank')} style={{ cursor: 'pointer' }}>
                                <div className={`action-status-icon ${STATUS_CLASS[s] || 'action-status-skipped'}`}>
                                    {STATUS_ICON[s] || <Circle size={16} />}
                                </div>
                                <div className="action-body">
                                    <div className="action-title">{run.name}</div>
                                    <div className="action-commit-msg">{run.head_commit.message}</div>
                                </div>
                                <div className="action-right">
                                    <span className="action-branch">{run.head_branch}</span>
                                    <span className="action-time">{timeAgo(run.created_at)}</span>
                                    <img src={run.actor.avatar_url} alt={run.actor.login} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
