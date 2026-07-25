import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle, CheckCircle, Search, X, MessageSquare,
    Circle, Flag, Plus, Loader, Github
} from 'lucide-react';
import { fetchGithubIssues } from '../api/github';
import type { GitHubIssue } from '../api/github';

interface AggregatedIssue {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    projectId: string;
    projectName: string;
    createdAt?: string;
    labels: string[];
    comments: number;
    assigneeInitial: string;
}

const LABEL_OPTIONS = ['bug', 'feature', 'docs', 'enhancement'];
const LABEL_MAP: Record<string, string> = {
    bug: 'issue-label-bug',
    feature: 'issue-label-feat',
    docs: 'issue-label-docs',
    enhancement: 'issue-label-enhance',
};

function assignLabels(title: string): string[] {
    const lower = title.toLowerCase();
    const labels: string[] = [];
    if (lower.includes('bug') || lower.includes('fix') || lower.includes('error')) labels.push('bug');
    if (lower.includes('feat') || lower.includes('add') || lower.includes('new') || lower.includes('create')) labels.push('feature');
    if (lower.includes('doc') || lower.includes('readme')) labels.push('docs');
    if (lower.includes('improve') || lower.includes('update') || lower.includes('refactor') || lower.includes('enhance')) labels.push('enhancement');
    if (labels.length === 0) labels.push(LABEL_OPTIONS[Math.floor(title.length % LABEL_OPTIONS.length)]);
    return labels;
}

export default function Issues() {
    const { projects, fetchProjects, loading: localLoading } = useProjectStore();
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'open' | 'closed'>('open');
    const [source, setSource] = useState<'local' | 'github'>('local');
    const [repo, setRepo] = useState('facebook/react');
    const [labelFilter, setLabelFilter] = useState('ALL');
    const navigate = useNavigate();

    const [ghIssues, setGhIssues] = useState<GitHubIssue[]>([]);
    const [ghLoading, setGhLoading] = useState(false);
    const [ghError, setGhError] = useState<string | null>(null);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    useEffect(() => {
        if (source !== 'github') return;
        const load = async () => {
            setGhLoading(true);
            setGhError(null);
            try {
                const data = await fetchGithubIssues(repo);
                setGhIssues(data);
            } catch (err: any) {
                setGhError(err.message);
            } finally {
                setGhLoading(false);
            }
        };
        const debounce = setTimeout(load, 500);
        return () => clearTimeout(debounce);
    }, [source, repo]);

    const allIssues: AggregatedIssue[] = projects.flatMap(project => {
        const doneCol = project.columns && project.columns.length > 0 ? project.columns[project.columns.length - 1] : null;
        return project.tasks.map((task, idx) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.columnId === doneCol?.id ? 'DONE' : 'OPEN',
            priority: task.priority,
            projectId: project.id,
            projectName: project.name,
            createdAt: task.createdAt,
            labels: assignLabels(task.title),
            comments: (task.title.length + idx) % 8,
            assigneeInitial: 'D',
        }));
    });

    const currentListLocal = tab === 'open' ? allIssues.filter(i => i.status !== 'DONE') : allIssues.filter(i => i.status === 'DONE');
    const filteredLocal = currentListLocal.filter(issue => {
        const matchesSearch = !search || issue.title.toLowerCase().includes(search.toLowerCase()) || issue.projectName.toLowerCase().includes(search.toLowerCase());
        const matchesLabel = labelFilter === 'ALL' || issue.labels.includes(labelFilter);
        return matchesSearch && matchesLabel;
    });

    const currentListGh = tab === 'open' ? ghIssues.filter(i => i.state === 'open') : ghIssues.filter(i => i.state !== 'open');
    const filteredGh = currentListGh.filter(issue => {
        const matchesSearch = !search || issue.title.toLowerCase().includes(search.toLowerCase());
        const matchesLabel = labelFilter === 'ALL' || issue.labels.some(l => l.name.toLowerCase().includes(labelFilter.toLowerCase()));
        return matchesSearch && matchesLabel;
    });

    const timeAgo = (dateStr?: string) => {
        if (!dateStr) return 'recently';
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'just now';
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    };

    const isLoading = source === 'local' ? localLoading : ghLoading;

    return (
        <div className="issues-page">
            <div className="issues-header">
                <div>
                    <h1>Issues</h1>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, gap: 12 }}>
                        <button className={`btn ${source === 'local' ? 'btn-primary' : ''}`} onClick={() => setSource('local')}>Local Tasks</button>
                        <button className={`btn ${source === 'github' ? 'btn-primary' : ''}`} onClick={() => setSource('github')}><Github size={14} /> GitHub</button>
                        
                        {source === 'github' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Repository:</span>
                                <input 
                                    value={repo} 
                                    onChange={e => setRepo(e.target.value)} 
                                    className="dash-search-input" 
                                    style={{ padding: '4px 8px', width: 200, fontSize: 13 }}
                                />
                            </div>
                        )}
                    </div>
                </div>
                {source === 'local' ? (
                    <button className="btn btn-primary" id="newIssueGlobalBtn" title="New Issue">
                        <Plus size={16} /> New Local Issue
                    </button>
                ) : (
                    <button className="btn btn-primary" title="New Issue" onClick={() => window.open(`https://github.com/${repo}/issues`, '_blank')}>
                        <Plus size={16} /> New GitHub Issue
                    </button>
                )}
            </div>

            <div className="issues-tabs">
                <button className={`tab-item ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>
                    <AlertCircle size={14} /> Open
                </button>
                <button className={`tab-item ${tab === 'closed' ? 'active' : ''}`} onClick={() => setTab('closed')}>
                    <CheckCircle size={14} /> Closed
                </button>
            </div>

            <div className="issues-toolbar">
                <div className="issues-search-bar">
                    <Search size={14} />
                    <input
                        id="issuesSearch"
                        type="text"
                        placeholder="Search issues…"
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
                <div className="issues-filters">
                    <button className={`pd-filter-chip ${labelFilter === 'ALL' ? 'active' : ''}`} onClick={() => setLabelFilter('ALL')}>All</button>
                    <button className={`pd-filter-chip ${labelFilter === 'bug' ? 'active' : ''}`} onClick={() => setLabelFilter('bug')}>
                        <Flag size={10} /> Bug
                    </button>
                    <button className={`pd-filter-chip ${labelFilter === 'feature' ? 'active' : ''}`} onClick={() => setLabelFilter('feature')}>Feature</button>
                    <button className={`pd-filter-chip ${labelFilter === 'enhancement' ? 'active' : ''}`} onClick={() => setLabelFilter('enhancement')}>Enhancement</button>
                </div>
                <span className="issues-count">{source === 'local' ? filteredLocal.length : filteredGh.length} results</span>
            </div>

            {source === 'github' && ghError && <div className="dash-error">{ghError}</div>}

            {isLoading ? (
                <div className="dash-loading" style={{ marginTop: 20 }}>
                    <Loader className="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div className="issues-list">
                    <div className="issues-list-header">
                        <span><AlertCircle size={12} /> {source === 'local' ? filteredLocal.length : filteredGh.length} {tab === 'open' ? 'open' : 'closed'}</span>
                    </div>
                    {(source === 'local' ? filteredLocal : filteredGh).length === 0 && <div className="issues-empty">No issues match your filters.</div>}
                    
                    {source === 'local' && filteredLocal.map(issue => (
                        <div key={issue.id} className="issue-row" onClick={() => navigate(`/app/project/${issue.projectId}`)}>
                            <div className={`issue-icon ${issue.status === 'DONE' ? 'issue-icon-closed' : 'issue-icon-open'}`}>
                                {issue.status === 'DONE' ? <CheckCircle size={16} /> : <Circle size={16} />}
                            </div>
                            <div className="issue-body">
                                <div>
                                    <span className="issue-title-link">{issue.title}</span>
                                    <span className="issue-labels">
                                        {issue.labels.map(label => (
                                            <span key={label} className={`issue-label ${LABEL_MAP[label] || ''}`}>{label}</span>
                                        ))}
                                    </span>
                                </div>
                                <div className="issue-meta">
                                    <span>#{issue.id.slice(0, 7)}</span>
                                    <span>opened {timeAgo(issue.createdAt)} in <strong>{issue.projectName}</strong></span>
                                </div>
                            </div>
                            <div className="issue-right">
                                {issue.comments > 0 && (
                                    <span className="issue-comments">
                                        <MessageSquare size={12} /> {issue.comments}
                                    </span>
                                )}
                                <div className="issue-assignee">{issue.assigneeInitial}</div>
                            </div>
                        </div>
                    ))}

                    {source === 'github' && filteredGh.map(issue => (
                        <div key={issue.id} className="issue-row" onClick={() => window.open(issue.html_url, '_blank')} style={{ cursor: 'pointer' }}>
                            <div className={`issue-icon ${issue.state !== 'open' ? 'issue-icon-closed' : 'issue-icon-open'}`}>
                                {issue.state !== 'open' ? <CheckCircle size={16} /> : <Circle size={16} />}
                            </div>
                            <div className="issue-body">
                                <div>
                                    <span className="issue-title-link">{issue.title}</span>
                                    <span className="issue-labels">
                                        {issue.labels.map(label => {
                                            const normalized = label.name.toLowerCase();
                                            const mapped = LABEL_MAP[normalized] || '';
                                            return <span key={label.name} className={`issue-label ${mapped}`} style={{ backgroundColor: `#${label.color}40`, color: `#${label.color}` }}>{label.name}</span>;
                                        })}
                                    </span>
                                </div>
                                <div className="issue-meta">
                                    <span>#{issue.number} opened {timeAgo(issue.created_at)} by {issue.user.login}</span>
                                </div>
                            </div>
                            <div className="issue-right">
                                {issue.comments > 0 && (
                                    <span className="issue-comments">
                                        <MessageSquare size={12} /> {issue.comments}
                                    </span>
                                )}
                                <div className="issue-assignee">
                                    <img src={issue.user.avatar_url} alt={issue.user.login} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
