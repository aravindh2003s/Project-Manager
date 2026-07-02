import { Link } from 'react-router-dom';
import { ArrowRight, FolderKanban, Shield, Users } from 'lucide-react';

export default function Home() {
    return (
        <div className="home-shell">
            <section className="home-hero">
                <div className="home-badge">Nexus Workspace</div>
                <h1>Project operations for teams that need clarity, not clutter.</h1>
                <p>
                    Plan work, manage delivery, and keep your project workspace organized in one
                    secure place built for modern software teams.
                </p>

                <div className="home-actions">
                    <Link to="/login" className="btn btn-primary">
                        Open Workspace <ArrowRight size={14} />
                    </Link>
                    <a href="#features" className="btn">View capabilities</a>
                </div>
            </section>

            <section className="home-preview card">
                <div className="home-preview-sidebar">
                    <div className="home-preview-brand">Nexus</div>
                    <div className="home-preview-nav">
                        <span>Dashboard</span>
                        <span>Projects</span>
                        <span>Issues</span>
                        <span>Repository</span>
                        <span>Settings</span>
                    </div>
                </div>
                <div className="home-preview-main">
                    <div className="home-preview-header">
                        <strong>Delivery overview</strong>
                        <span>3 active projects</span>
                    </div>
                    <div className="home-preview-stats">
                        <div><strong>18</strong><span>Open issues</span></div>
                        <div><strong>76%</strong><span>Sprint completion</span></div>
                        <div><strong>4</strong><span>Team members</span></div>
                    </div>
                    <div className="home-preview-board">
                        <div className="home-preview-column"><span>Todo</span><div /><div /></div>
                        <div className="home-preview-column"><span>In Progress</span><div /><div /></div>
                        <div className="home-preview-column"><span>Done</span><div /><div /></div>
                    </div>
                </div>
            </section>

            <section id="features" className="home-features">
                <div className="card home-feature-card">
                    <FolderKanban size={20} />
                    <h3>Structured delivery</h3>
                    <p>Track projects, issues, and progress with a clearer workflow-focused workspace.</p>
                </div>
                <div className="card home-feature-card">
                    <Users size={20} />
                    <h3>Team ownership</h3>
                    <p>Support real users, personalized settings, and a more credible multi-user foundation.</p>
                </div>
                <div className="card home-feature-card">
                    <Shield size={20} />
                    <h3>Safer operations</h3>
                    <p>Protected routes and authenticated API access keep project data behind sign-in.</p>
                </div>
            </section>
        </div>
    );
}
