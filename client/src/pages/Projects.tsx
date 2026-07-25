import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, getProjectStats } from '../store/projectStore';
import { Search, X, Plus, Folder, Star, GitFork, AlertCircle } from 'lucide-react';

export default function Projects() {
    const { projects, loading, fetchProjects, createProject } = useProjectStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('updated');
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        await createProject(newName, newDesc);
        setNewName(''); setNewDesc(''); setShowModal(false);
    };

    const filtered = projects
        .filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            if (sortBy === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'tasks') return b.tasks.length - a.tasks.length;
            return 0;
        });

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'today';
        if (days === 1) return 'yesterday';
        if (days < 30) return `${days} days ago`;
        return `${Math.floor(days / 30)} months ago`;
    };

    return (
        <div className="projects-page">
            <div className="projects-header">
                <h1>Projects</h1>
                <button className="btn btn-primary" id="newProjectBtn" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> New Project
                </button>
            </div>

            <div className="projects-toolbar">
                <div className="projects-search-bar">
                    <Search size={14} />
                    <input
                        id="projectsSearch"
                        type="text"
                        placeholder="Find a project…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="projects-search-input"
                    />
                    {searchTerm && (
                        <button className="dash-search-clear" title="Clear" onClick={() => setSearchTerm('')}>
                            <X size={12} />
                        </button>
                    )}
                </div>
                <div className="projects-sort">
                    <label htmlFor="projectSort">Sort:</label>
                    <select id="projectSort" title="Sort projects" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="updated">Last updated</option>
                        <option value="name">Name</option>
                        <option value="tasks">Most tasks</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="dash-loading">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton-card"></div>)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="projects-empty">
                    <Folder size={48} />
                    <h3>{searchTerm ? 'No projects match your search' : 'No projects yet'}</h3>
                    <p>Create your first project to get started</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={14} /> New Project
                    </button>
                </div>
            ) : (
                <div className="projects-list">
                    {filtered.map(project => {
                        const stats = getProjectStats(project as any);
                        const todoCount = stats.todo;
                        const inProgressCount = stats.inProgress;
                        const openIssues = todoCount + inProgressCount;
                        return (
                            <div
                                key={project.id}
                                className="projects-list-item"
                                onClick={() => navigate(`/app/project/${project.id}`)}
                            >
                                <div className="projects-list-item-icon">{project.name.charAt(0).toUpperCase()}</div>
                                <div className="projects-list-item-info">
                                    <div className="projects-list-item-name">{project.name}</div>
                                    {project.description && (
                                        <div className="projects-list-item-desc">{project.description}</div>
                                    )}
                                </div>
                                <div className="projects-list-item-meta">
                                    <span className="projects-list-item-lang">
                                        <span className="repo-dot repo-dot-blue"></span>
                                        TypeScript
                                    </span>
                                    <span className="projects-list-item-stat" title="Open issues">
                                        <AlertCircle size={13} /> {openIssues}
                                    </span>
                                    <span className="projects-list-item-stat" title="Total tasks">
                                        <GitFork size={13} /> {project.tasks.length}
                                    </span>
                                    <span className="projects-list-item-stat" title="Star">
                                        <Star size={13} />
                                    </span>
                                    <span className="projects-list-item-time">
                                        Updated {timeAgo(project.updatedAt)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="card modal-card modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create New Project</h3>
                            <button className="modal-close btn" title="Close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="modal-form">
                            <label className="form-label" htmlFor="newProjName">Project Name *</label>
                            <input id="newProjName" required placeholder="e.g. Marketing Website" value={newName}
                                onChange={e => setNewName(e.target.value)} className="modal-input" />
                            <label className="form-label" htmlFor="newProjDesc">Description</label>
                            <textarea id="newProjDesc" placeholder="Describe the project goal…" value={newDesc}
                                onChange={e => setNewDesc(e.target.value)} className="modal-input modal-textarea" rows={3} />
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
