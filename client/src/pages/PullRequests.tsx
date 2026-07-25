import { useState, useEffect } from 'react';
import {
    GitPullRequest, GitMerge, Search, X, CheckCircle,
    ArrowRight, Plus, Loader
} from 'lucide-react';
import { fetchGithubPullRequests } from '../api/github';
import type { GitHubPullRequest } from '../api/github';

export default function PullRequests() {
    const [repo, setRepo] = useState('facebook/react');
    const [tab, setTab] = useState<'open' | 'closed'>('open');
    const [search, setSearch] = useState('');
    const [prs, setPrs] = useState<GitHubPullRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchGithubPullRequests(repo);
                setPrs(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        const debounce = setTimeout(load, 500);
        return () => clearTimeout(debounce);
    }, [repo]);

    const openPRs = prs.filter(pr => pr.state === 'open');
    const closedPRs = prs.filter(pr => pr.state !== 'open');
    const currentList = tab === 'open' ? openPRs : closedPRs;

    const filtered = currentList.filter(pr =>
        !search || pr.title.toLowerCase().includes(search.toLowerCase()) || pr.head.ref.includes(search.toLowerCase())
    );

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    };

    return (
        <div className="pulls-page">
            <div className="pulls-header">
                <div>
                    <h1>Pull Requests</h1>
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
                <button className="btn btn-primary" id="newPRBtn" title="New Pull Request" onClick={() => window.open(`https://github.com/${repo}/pulls`, '_blank')}>
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

            {error && <div className="dash-error">{error}</div>}

            {loading ? (
                <div className="dash-loading" style={{ marginTop: 20 }}>
                    <Loader className="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div className="issues-list">
                    <div className="issues-list-header">
                        <span><GitPullRequest size={12} /> {filtered.length} {tab}</span>
                    </div>
                    {filtered.length === 0 && <div className="issues-empty">No pull requests found.</div>}
                    {filtered.map(pr => (
                        <div key={pr.id} className="pr-row" onClick={() => window.open(pr.html_url, '_blank')} style={{ cursor: 'pointer' }}>
                            <div className={`pr-icon ${pr.state === 'open' ? 'pr-icon-open' : 'pr-icon-closed'}`}>
                                {pr.state === 'open' ? <GitPullRequest size={16} /> : <GitMerge size={16} />}
                            </div>
                            <div className="pr-body">
                                <div>
                                    <span className="pr-title-link">{pr.title}</span>
                                    <span className="pr-branches">
                                        <span className="pr-branch">{pr.head.ref}</span>
                                        <ArrowRight size={10} className="pr-arrow" />
                                        <span className="pr-branch">{pr.base.ref}</span>
                                    </span>
                                </div>
                                <div className="pr-meta">
                                    <span>#{pr.number} opened {timeAgo(pr.created_at)} by {pr.user.login}</span>
                                </div>
                            </div>
                            <div className="pr-right">
                                {pr.draft && <span className="pr-review-status pr-review-pending">Draft</span>}
                                <div className="issue-assignee">
                                    <img src={pr.user.avatar_url} alt={pr.user.login} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
