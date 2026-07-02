import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle, CheckCircle, Search, X, MessageSquare,
    Circle, Flag, Plus
} from 'lucide-react';

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
    const { projects, fetchProjects, loading } = useProjectStore();
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'open' | 'closed'>('open');
    const [labelFilter, setLabelFilter] = useState('ALL');
    const navigate = useNavigate();

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    // Aggregate all tasks across every project as "issues"
    const allIssues: AggregatedIssue[] = projects.flatMap(project =>
        project.tasks.map((task, idx) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            projectId: project.id,
            projectName: project.name,
            createdAt: task.createdAt,
            labels: assignLabels(task.title),
            comments: (task.title.length + idx) % 8,
            assigneeInitial: 'D',
        }))
    );

    const openIssues = allIssues.filter(i => i.status !== 'DONE');
    const closedIssues = allIssues.filter(i => i.status === 'DONE');

    const currentList = tab === 'open' ? openIssues : closedIssues;

    const filtered = currentList
        .filter(issue => {
            const matchesSearch = !search ||
                issue.title.toLowerCase().includes(search.toLowerCase()) ||
                issue.projectName.toLowerCase().includes(search.toLowerCase());
            const matchesLabel = labelFilter === 'ALL' || issue.labels.includes(labelFilter);
            return matchesSearch && matchesLabel;
        });

    const timeAgo = (dateStr?: string) => {
        if (!dateStr) return 'recently';
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'just now';
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return 'yesterday';
        return `${days} days ago`;
    };

    return (
        <div className="issues-page">
            <div className="issues-header">
                <h1>Issues</h1>
                <button className="btn btn-primary" id="newIssueGlobalBtn" title="New Issue">
                    <Plus size={16} /> New Issue
                </button>
            </div>

            <div className="issues-tabs">
                <button className={`tab-item ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>
                    <AlertCircle size={14} /> {openIssues.length} Open
                </button>
                <button className={`tab-item ${tab === 'closed' ? 'active' : ''}`} onClick={() => setTab('closed')}>
                    <CheckCircle size={14} /> {closedIssues.length} Closed
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
                <span className="issues-count">{filtered.length} results</span>
            </div>

            {loading ? (
                <div className="dash-loading">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton-card"></div>)}
                </div>
            ) : (
                <div className="issues-list">
                    <div className="issues-list-header">
                        <span><AlertCircle size={12} /> {filtered.length} {tab === 'open' ? 'open' : 'closed'}</span>
                    </div>
                    {filtered.length === 0 && <div className="issues-empty">No issues match your filters.</div>}
                    {filtered.map(issue => (
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
                </div>
            )}
        </div>
    );
}
