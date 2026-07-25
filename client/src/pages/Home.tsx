import { Link } from 'react-router-dom';
import { ArrowRight, FolderKanban, Shield, Users, Sparkles } from 'lucide-react';

export default function Home() {
    return (
        <div className="home-shell">
            {/* Background Effects */}
            <div className="home-glow home-glow-primary"></div>
            <div className="home-glow home-glow-secondary"></div>
            
            <header className="home-header">
                <div className="home-brand">
                    <Sparkles size={24} className="home-brand-icon" />
                    <span>GrowTech PMS</span>
                </div>
                <div className="home-nav">
                    <Link to="/login" className="btn btn-primary home-nav-btn">
                        Sign In <ArrowRight size={14} />
                    </Link>
                </div>
            </header>

            <main className="home-main">
                <section className="home-hero">
                    <div className="home-badge">
                        <Sparkles size={12} /> Introducing GrowTech PMS 2.0
                    </div>
                    <h1 className="home-title">
                        Operations for teams that need <br />
                        <span className="text-gradient">clarity, not clutter.</span>
                    </h1>
                    <p className="home-subtitle">
                        Plan work, manage delivery, and keep your project workspace organized in one
                        secure place built for modern software teams.
                    </p>

                    <div className="home-actions">
                        <Link to="/login" className="btn btn-primary btn-lg">
                            Get Started Free <ArrowRight size={16} />
                        </Link>
                        <a href="#features" className="btn btn-secondary btn-lg">
                            Explore Capabilities
                        </a>
                    </div>
                </section>

                <section className="home-preview-section">
                    <div className="home-preview-window">
                        <div className="preview-topbar">
                            <div className="preview-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div className="preview-content">
                            <div className="preview-sidebar">
                                <div className="preview-sidebar-item active"></div>
                                <div className="preview-sidebar-item"></div>
                                <div className="preview-sidebar-item"></div>
                            </div>
                            <div className="preview-main">
                                <div className="preview-header"></div>
                                <div className="preview-stats">
                                    <div className="preview-stat-box"></div>
                                    <div className="preview-stat-box"></div>
                                    <div className="preview-stat-box"></div>
                                </div>
                                <div className="preview-board">
                                    <div className="preview-col"><div className="preview-card"></div><div className="preview-card"></div></div>
                                    <div className="preview-col"><div className="preview-card"></div></div>
                                    <div className="preview-col"><div className="preview-card"></div><div className="preview-card"></div><div className="preview-card"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="home-features">
                    <div className="home-feature-card">
                        <div className="feature-icon-wrapper">
                            <FolderKanban size={24} />
                        </div>
                        <h3>Structured Delivery</h3>
                        <p>Track projects, issues, and progress with a clearer workflow-focused workspace designed for speed.</p>
                    </div>
                    <div className="home-feature-card">
                        <div className="feature-icon-wrapper">
                            <Users size={24} />
                        </div>
                        <h3>Team Ownership</h3>
                        <p>Support real users, personalized settings, and a more credible multi-user foundation built for scale.</p>
                    </div>
                    <div className="home-feature-card">
                        <div className="feature-icon-wrapper">
                            <Shield size={24} />
                        </div>
                        <h3>Safer Operations</h3>
                        <p>Protected routes and authenticated API access keep project data secure behind sign-in.</p>
                    </div>
                </section>
            </main>
        </div>
    );
}
