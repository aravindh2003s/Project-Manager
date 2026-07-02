import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
    LayoutDashboard, Folder, AlertCircle, Settings,
    User, Bell, Search, ChevronDown, Plus, Zap,
    FileText, GitBranch, Code2, Workflow, LayoutGrid, UploadCloud
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

const REPO_COLORS = ['repo-dot-blue', 'repo-dot-green', 'repo-dot-purple', 'repo-dot-yellow'];

function MainLayout() {
    const [notifOpen, setNotifOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [newOpen, setNewOpen] = useState(false);
    const navigate = useNavigate();
    const { projects, fetchProjects } = useProjectStore();
    const { user, logout } = useAuthStore();
    const newDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (newDropdownRef.current && !newDropdownRef.current.contains(e.target as Node)) {
                setNewOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openIssueCount = projects.reduce(
        (acc, p) => acc + p.tasks.filter(t => t.status !== 'DONE').length, 0
    );
    const displayName = user?.name || 'Workspace User';
    const displayEmail = user?.email || 'Signed out';
    const avatarLetter = displayName.charAt(0).toUpperCase();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="ml-layout">
            {/* Sidebar */}
            <aside className="ml-sidebar">
                <div className="ml-logo">
                    <Zap size={20} className="ml-logo-icon" />
                    <span>Nexus</span>
                </div>

                <div className="ml-new-dropdown-wrap" ref={newDropdownRef}>
                    <button className="ml-new-btn" onClick={() => setNewOpen(!newOpen)}>
                        <Plus size={14} />
                        New
                        <ChevronDown size={12} />
                    </button>
                    {newOpen && (
                        <div className="ml-new-dropdown">
                            <button className="ml-new-dropdown-item" onClick={() => { navigate('/app'); setNewOpen(false); }}>
                                <Folder size={14} /> New Project
                            </button>
                            <button className="ml-new-dropdown-item" onClick={() => { navigate('/app/issues'); setNewOpen(false); }}>
                                <AlertCircle size={14} /> New Issue
                            </button>
                            <button className="ml-new-dropdown-item" onClick={() => { navigate('/app/pulls'); setNewOpen(false); }}>
                                <GitBranch size={14} /> New Pull Request
                            </button>
                            <button className="ml-new-dropdown-item" onClick={() => { navigate('/app/discussions'); setNewOpen(false); }}>
                                <FileText size={14} /> New Discussion
                            </button>
                        </div>
                    )}
                </div>

                <nav className="ml-nav">
                    <NavLink to="/app" end className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                        <LayoutDashboard size={16} />
                        <span>Home</span>
                    </NavLink>
                    <NavLink to="/app/issues" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                        <AlertCircle size={16} />
                        <span>Issues</span>
                        {openIssueCount > 0 && <span className="ml-badge">{openIssueCount}</span>}
                    </NavLink>
                    <NavLink to="/app/projects" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                        <Folder size={16} />
                        <span>Projects</span>
                    </NavLink>
                    <NavLink to="/app/upload" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                        <UploadCloud size={16} />
                        <span>Import Project</span>
                    </NavLink>

                    <div className="ml-nav-section-label">Workspace Tools</div>
                    <NavLink to="/app/repo" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                        <Code2 size={16} />
                        <span>Repository</span>
                    </NavLink>
                    <NavLink to="/app/pipeline" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                        <Workflow size={16} />
                        <span>Pipeline Designer</span>
                    </NavLink>
                    <NavLink to="/app/my-dashboard" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                        <LayoutGrid size={16} />
                        <span>Custom Dashboard</span>
                    </NavLink>

                    {projects.length > 0 && (
                        <>
                            <div className="ml-nav-section-label">Recent Projects</div>
                            {projects.slice(0, 5).map((project, idx) => (
                                <NavLink key={project.id}
                                    to={`/app/project/${project.id}`}
                                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                                    <span className={`repo-dot ${REPO_COLORS[idx % REPO_COLORS.length]}`}></span>
                                    <span>{project.name}</span>
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                <div className="ml-nav-bottom">
                    <NavLink to="/app/settings" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                        <Settings size={16} />
                        <span>Settings</span>
                    </NavLink>
                    <div className="ml-profile-card">
                        <div className="ml-avatar">{avatarLetter}</div>
                        <div className="ml-profile-info">
                            <span className="ml-profile-name">{displayName}</span>
                            <span className="ml-profile-email">{displayEmail}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="ml-content-wrapper">
                {/* Top Bar */}
                <header className="ml-topbar">
                    <div className="ml-search-bar">
                        <Search size={14} className="ml-search-icon" />
                        <input
                            id="globalSearch"
                            type="text"
                            placeholder="Search projects, issues, tasks…"
                            className="ml-search-input"
                        />
                        <kbd className="ml-search-kbd">⌘K</kbd>
                    </div>
                    <div className="ml-topbar-actions">
                        <button className="ml-icon-btn" onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }} title="Notifications">
                            <Bell size={16} />
                            <span className="ml-notif-dot"></span>
                        </button>
                        <button className="ml-icon-btn" onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }} title="Profile">
                            <User size={16} />
                        </button>
                        {userOpen && (
                            <div className="ml-dropdown">
                                <div className="ml-dropdown-header">
                                    <div className="ml-avatar ml-avatar-sm">{avatarLetter}</div>
                                    <div>
                                        <div className="ml-dropdown-name">{displayName}</div>
                                        <div className="ml-dropdown-email">{displayEmail}</div>
                                    </div>
                                </div>
                                <div className="ml-dropdown-divider"></div>
                                <a href="/app/settings" className="ml-dropdown-item">Settings</a>
                                <button type="button" className="ml-dropdown-item ml-dropdown-danger ml-dropdown-button" onClick={handleLogout}>Sign out</button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="ml-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
