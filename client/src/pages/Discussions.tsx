import { useState } from 'react';
import {
    MessageSquare, ThumbsUp, MessageCircle, Plus,
    Lightbulb, HelpCircle, Megaphone
} from 'lucide-react';

interface Discussion {
    id: string;
    title: string;
    excerpt: string;
    author: string;
    authorInitial: string;
    category: 'general' | 'ideas' | 'q-and-a' | 'show-and-tell';
    replies: number;
    upvotes: number;
    createdAt: string;
}

const CATEGORY_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    'general': { label: 'General', className: 'discussion-cat-general', icon: <MessageSquare size={14} /> },
    'ideas': { label: 'Ideas', className: 'discussion-cat-ideas', icon: <Lightbulb size={14} /> },
    'q-and-a': { label: 'Q&A', className: 'discussion-cat-qa', icon: <HelpCircle size={14} /> },
    'show-and-tell': { label: 'Show & Tell', className: 'discussion-cat-show', icon: <Megaphone size={14} /> },
};

const MOCK_DISCUSSIONS: Discussion[] = [
    { id: '1', title: 'What tech stack are you all using for microservices?', excerpt: 'I\'m curious about what everyone is using for their microservices architecture. We\'ve been looking at gRPC vs REST and would love to hear real-world experiences.', author: 'Demo User', authorInitial: 'D', category: 'general', replies: 12, upvotes: 24, createdAt: '2 hours ago' },
    { id: '2', title: 'Feature request: Dark mode toggle in settings', excerpt: 'It would be great to have a theme toggle right in the settings panel. Currently the dark mode is hardcoded and some users might prefer a light variant.', author: 'Alice Chen', authorInitial: 'A', category: 'ideas', replies: 8, upvotes: 45, createdAt: '5 hours ago' },
    { id: '3', title: 'How do I set up CI/CD pipelines for this project?', excerpt: 'I\'m new to the project and trying to understand how the CI/CD pipeline works. Can someone walk me through the GitHub Actions configuration?', author: 'Bob Martinez', authorInitial: 'B', category: 'q-and-a', replies: 6, upvotes: 15, createdAt: '1 day ago' },
    { id: '4', title: 'Built a real-time collaboration feature!', excerpt: 'Hey everyone! I just finished implementing WebSocket-based real-time collaboration for the kanban board. Multiple users can now drag cards simultaneously.', author: 'Demo User', authorInitial: 'D', category: 'show-and-tell', replies: 21, upvotes: 67, createdAt: '2 days ago' },
    { id: '5', title: 'Best practices for Prisma schema migrations?', excerpt: 'We\'re running into some issues with Prisma migrations in production. What strategies do you all use for handling schema changes with zero downtime?', author: 'Carol Wang', authorInitial: 'C', category: 'q-and-a', replies: 9, upvotes: 31, createdAt: '3 days ago' },
    { id: '6', title: 'Proposal: Add role-based access control', excerpt: 'I think we should implement RBAC for workspaces. Different team members should have different permission levels — admin, editor, viewer, etc.', author: 'Dave Kim', authorInitial: 'K', category: 'ideas', replies: 15, upvotes: 52, createdAt: '4 days ago' },
    { id: '7', title: 'Weekly standup notes — Sprint 4', excerpt: 'Sharing the standup notes from this week\'s sprint planning. We covered task prioritization, velocity metrics, and upcoming milestones for Q2.', author: 'Demo User', authorInitial: 'D', category: 'general', replies: 3, upvotes: 8, createdAt: '5 days ago' },
];

export default function Discussions() {
    const [activeCategory, setActiveCategory] = useState('all');

    const filtered = activeCategory === 'all'
        ? MOCK_DISCUSSIONS
        : MOCK_DISCUSSIONS.filter(d => d.category === activeCategory);

    return (
        <div className="discussions-page">
            <div className="discussions-header">
                <h1>Discussions</h1>
                <button className="btn btn-primary" id="newDiscussionBtn" title="Start discussion">
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

            <div className="discussions-list">
                {filtered.map(discussion => (
                    <div key={discussion.id} className="discussion-item">
                        <div className="discussion-avatar">{discussion.authorInitial}</div>
                        <div className="discussion-body">
                            <div className="discussion-title">{discussion.title}</div>
                            <div className="discussion-excerpt">{discussion.excerpt}</div>
                            <div className="discussion-footer">
                                <span className={`discussion-cat-tag ${CATEGORY_MAP[discussion.category]?.className}`}>
                                    {CATEGORY_MAP[discussion.category]?.label}
                                </span>
                                <span>{discussion.author} · {discussion.createdAt}</span>
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
        </div>
    );
}
