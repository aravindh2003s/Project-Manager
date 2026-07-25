import { useState, useEffect } from 'react';
import {
    MessageSquare, ThumbsUp, MessageCircle, Plus,
    Lightbulb, HelpCircle, Megaphone, Loader
} from 'lucide-react';
import { fetchGithubDiscussionsMock } from '../api/github';
import type { GitHubIssue } from '../api/github';

const CATEGORY_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    'general': { label: 'General', className: 'discussion-cat-general', icon: <MessageSquare size={14} /> },
    'ideas': { label: 'Ideas', className: 'discussion-cat-ideas', icon: <Lightbulb size={14} /> },
    'q-and-a': { label: 'Q&A', className: 'discussion-cat-qa', icon: <HelpCircle size={14} /> },
    'show-and-tell': { label: 'Show & Tell', className: 'discussion-cat-show', icon: <Megaphone size={14} /> },
};

function assignCategory(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('idea') || lower.includes('proposal') || lower.includes('feature')) return 'ideas';
    if (lower.includes('how') || lower.includes('why') || lower.includes('what') || lower.includes('?')) return 'q-and-a';
    if (lower.includes('show') || lower.includes('built') || lower.includes('release')) return 'show-and-tell';
    return 'general';
}

export default function Discussions() {
    const [repo, setRepo] = useState('facebook/react');
    const [activeCategory, setActiveCategory] = useState('all');
    const [discussions, setDiscussions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchGithubDiscussionsMock(repo);
                const mapped = data.map((issue: GitHubIssue) => ({
                    id: String(issue.id),
                    number: issue.number,
                    title: issue.title,
                    excerpt: `Join the conversation on #${issue.number}...`,
                    author: issue.user.login,
                    avatar: issue.user.avatar_url,
                    category: assignCategory(issue.title),
                    replies: issue.comments,
                    upvotes: Math.floor(issue.comments * 1.5), // Mock upvotes
                    createdAt: issue.created_at,
                    html_url: issue.html_url
                }));
                setDiscussions(mapped);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        const debounce = setTimeout(load, 500);
        return () => clearTimeout(debounce);
    }, [repo]);

    const filtered = activeCategory === 'all'
        ? discussions
        : discussions.filter(d => d.category === activeCategory);

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'recently';
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    };

    return (
        <div className="discussions-page">
            <div className="discussions-header">
                <div>
                    <h1>Discussions</h1>
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
                <button className="btn btn-primary" id="newDiscussionBtn" title="Start discussion" onClick={() => window.open(`https://github.com/${repo}/discussions`, '_blank')}>
                    <Plus size={16} /> New Discussion
                </button>
            </div>

            <div className="discussions-categories">
                <button className={`discussion-cat-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
                    <MessageSquare size={14} /> All
                </button>
                {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                    <button key={key} className={`discussion-cat-btn ${activeCategory === key ? 'active' : ''}`} onClick={() => setActiveCategory(key)}>
                        {val.icon} {val.label}
                    </button>
                ))}
            </div>

            {error && <div className="dash-error">{error}</div>}

            {loading ? (
                <div className="dash-loading" style={{ marginTop: 20 }}>
                    <Loader className="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div className="discussions-list">
                    {filtered.length === 0 && <div className="issues-empty">No discussions found.</div>}
                    {filtered.map(discussion => (
                        <div key={discussion.id} className="discussion-item" onClick={() => window.open(discussion.html_url, '_blank')} style={{ cursor: 'pointer' }}>
                            <div className="discussion-avatar">
                                <img src={discussion.avatar} alt={discussion.author} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                            </div>
                            <div className="discussion-body">
                                <div className="discussion-title">{discussion.title}</div>
                                <div className="discussion-excerpt">{discussion.excerpt}</div>
                                <div className="discussion-footer">
                                    <span className={`discussion-cat-tag ${CATEGORY_MAP[discussion.category]?.className}`}>
                                        {CATEGORY_MAP[discussion.category]?.label}
                                    </span>
                                    <span>{discussion.author} · {timeAgo(discussion.createdAt)}</span>
                                </div>
                            </div>
                            <div className="discussion-right">
                                <span className="discussion-replies">
                                    <MessageCircle size={13} /> {discussion.replies}
                                </span>
                                <span className="discussion-upvotes">
                                    <ThumbsUp size={12} /> {discussion.upvotes}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
