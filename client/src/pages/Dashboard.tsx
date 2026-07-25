import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, getProjectStats } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { Plus, TrendingUp, CheckCircle, Clock, Circle, Search, X, Folder } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
    const { projects, loading, fetchProjects, createProject, error } = useProjectStore();
    const user = useAuthStore(state => state.user);
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        await createProject(newName, newDesc);
        setNewName(''); setNewDesc(''); setShowModal(false);
    };

    const totalTasks = projects.reduce((a, p) => a + p.tasks.length, 0);
    const doneTasks = projects.reduce((a, p) => a + getProjectStats(p as any).done, 0);
    const inProgressTasks = projects.reduce((a, p) => a + getProjectStats(p as any).inProgress, 0);
    const todoTasks = projects.reduce((a, p) => a + getProjectStats(p as any).todo, 0);
    const overallRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="dash-page">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">Dashboard</h1>
                    <p className="dash-subtitle">Welcome back, {user?.name || 'User'} — here's your workspace overview.</p>
                </div>
                <button className="btn btn-primary" id="newProjectBtn" title="Create new project" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> New Project
                </button>
            </div>

            {error && <div className="dash-error">{error}</div>}

            <div className="dash-stats">
                <StatCard icon={<Folder size={20} />} label="Total Projects" value={projects.length} color="accent" />
                <StatCard icon={<TrendingUp size={20} />} label="Total Tasks" value={totalTasks} color="warning" />
                <StatCard icon={<Clock size={20} />} label="In Progress" value={inProgressTasks} color="info" />
                <StatCard icon={<CheckCircle size={20} />} label="Completed" value={doneTasks} color="success" />
            </div>

            {totalTasks > 0 && (
                <div className="dash-progress-card card">
                    <div className="dash-progress-header">
                        <span className="dash-progress-label">Overall Completion</span>
                        <span className="dash-progress-pct">{overallRate}%</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${overallRate}%` }}></div>
                    </div>
                    <div className="dash-progress-breakdown">
                        <span><Circle size={10} className="color-muted" /> {todoTasks} Todo</span>
                        <span><Clock size={10} className="color-warning" /> {inProgressTasks} In Progress</span>
                        <span><CheckCircle size={10} className="color-success" /> {doneTasks} Done</span>
                    </div>
                </div>
            )}

            <div className="dash-section-header">
                <h2 className="dash-section-title">Projects ({projects.length})</h2>
                <div className="dash-search">
                    <Search size={14} />
                    <input id="projectSearch" type="text" placeholder="Filter projects…" value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)} className="dash-search-input" />
                    {searchTerm && (
                        <button className="dash-search-clear" title="Clear search" onClick={() => setSearchTerm('')}>
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="dash-loading">
                    {[1,2,3].map(i => <div key={i} className="skeleton-card"></div>)}
                </div>
            ) : (
                <div className="dashboard-grid">
                    {filtered.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                    {filtered.length === 0 && (
                        <div className="dash-empty">
                            <Folder size={40} className="dash-empty-icon" />
                            <p>No projects found</p>
                            <button className="btn btn-primary" title="Create new project" onClick={() => setShowModal(true)}>
                                <Plus size={14} /> Create your first project
                            </button>
                        </div>
                    )}
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
                            <label className="form-label" htmlFor="projName">Project Name *</label>
                            <input id="projName" required placeholder="e.g. Marketing Website" value={newName}
                                onChange={e => setNewName(e.target.value)} className="modal-input" />
                            <label className="form-label" htmlFor="projDesc">Description</label>
                            <textarea id="projDesc" placeholder="Describe the project goal…" value={newDesc}
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
    return (
        <div className={`stat-card stat-${color}`}>
            <div className={`stat-icon stat-icon-${color}`}>{icon}</div>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}

function ProjectCard({ project }: { project: any }) {
    const navigate = useNavigate();
    const stats = getProjectStats(project as any);
    const total = project.tasks.length;
    const rate = stats.completionRate;
    const inProgress = stats.inProgress;

    return (
        <div className="card project-card" onClick={() => navigate(`/app/project/${project.id}`)}>
            <div className="project-card-top">
                <div className="project-card-icon">{project.name.charAt(0).toUpperCase()}</div>
                <div className="project-card-meta">
                    <h3 className="project-card-title">{project.name}</h3>
                    {project.description && <p className="project-card-desc">{project.description}</p>}
                </div>
            </div>
            <div className="project-card-progress">
                <div className="project-progress-header">
                    <span className="text-sm text-muted">Progress</span>
                    <span className="text-sm project-progress-pct">{rate}%</span>
                </div>
                <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${rate}%` }}></div>
                </div>
            </div>
            <div className="project-card-badges">
                <span className="badge-active">Active</span>
                {inProgress > 0 && <span className="badge-inprogress">{inProgress} In&nbsp;Progress</span>}
                <span className="badge-tasks">{total} Tasks</span>
            </div>
            <div className="project-card-footer">
                <span className="text-sm text-muted">Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
}

export default Dashboard;
