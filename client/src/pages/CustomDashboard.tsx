import { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import type { Layout as GridLayoutLayout, LayoutItem as GridLayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useProjectStore, getProjectStats } from '../store/projectStore';
import {
    BarChart2, CheckCircle, Clock, Zap, GitCommit,
    AlertCircle, GitPullRequest, Activity, Plus, X,
    GripHorizontal, TrendingUp, Users, Calendar
} from 'lucide-react';

// ── Individual Widgets ───────────────────────────────
function StatsWidget({ projects }: { projects: any[] }) {
    const total = projects.length;
    const totalTasks = projects.reduce((a, p) => a + p.tasks.length, 0);
    const done = projects.reduce((a, p) => a + getProjectStats(p as any).done, 0);
    const inProgress = projects.reduce((a, p) => a + getProjectStats(p as any).inProgress, 0);
    return (
        <div className="widget-content">
            <div className="widget-stats-grid">
                <div className="widget-stat-card">
                    <BarChart2 size={18} className="widget-stat-icon-blue" />
                    <div className="widget-stat-val">{total}</div>
                    <div className="widget-stat-label">Projects</div>
                </div>
                <div className="widget-stat-card">
                    <CheckCircle size={18} className="widget-stat-icon-green" />
                    <div className="widget-stat-val">{done}</div>
                    <div className="widget-stat-label">Done</div>
                </div>
                <div className="widget-stat-card">
                    <Clock size={18} className="widget-stat-icon-yellow" />
                    <div className="widget-stat-val">{inProgress}</div>
                    <div className="widget-stat-label">In Progress</div>
                </div>
                <div className="widget-stat-card">
                    <AlertCircle size={18} className="widget-stat-icon-red" />
                    <div className="widget-stat-val">{totalTasks - done - inProgress}</div>
                    <div className="widget-stat-label">Todo</div>
                </div>
            </div>
        </div>
    );
}

function ActivityFeedWidget() {
    const items = [
        { icon: <GitCommit size={13} />, text: 'Pushed 3 commits to main', time: '2m ago', color: 'blue' },
        { icon: <CheckCircle size={13} />, text: 'Build and Test workflow passed', time: '8m ago', color: 'green' },
        { icon: <AlertCircle size={13} />, text: 'Issue #42 opened: Fix login bug', time: '15m ago', color: 'yellow' },
        { icon: <GitPullRequest size={13} />, text: 'PR #38 merged: feat/kanban', time: '1h ago', color: 'purple' },
        { icon: <Zap size={13} />, text: 'Deploy to AWS completed', time: '2h ago', color: 'blue' },
        { icon: <CheckCircle size={13} />, text: 'Sprint 4 planning completed', time: '3h ago', color: 'green' },
        { icon: <Activity size={13} />, text: 'Security scan: No vulnerabilities', time: '5h ago', color: 'green' },
    ];
    return (
        <div className="widget-content widget-feed">
            {items.map((item, i) => (
                <div key={i} className="widget-feed-item">
                    <span className={`widget-feed-icon widget-feed-icon-${item.color}`}>{item.icon}</span>
                    <span className="widget-feed-text">{item.text}</span>
                    <span className="widget-feed-time">{item.time}</span>
                </div>
            ))}
        </div>
    );
}

function HeatmapWidget() {
    const weeks = 12;
    const days = 7;
    const data = Array.from({ length: weeks }, () =>
        Array.from({ length: days }, () => Math.floor(Math.random() * 5))
    );
    const levels = ['heatmap-0', 'heatmap-1', 'heatmap-2', 'heatmap-3', 'heatmap-4'];
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return (
        <div className="widget-content">
            <div className="heatmap-wrap">
                <div className="heatmap-day-labels">{dayLabels.map((d, i) => <span key={i}>{d}</span>)}</div>
                <div className="heatmap-grid">
                    {data.map((week, wi) => (
                        <div key={wi} className="heatmap-week">
                            {week.map((val, di) => (
                                <div key={di} className={`heatmap-cell ${levels[val]}`} title={`${val} contributions`} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="heatmap-legend">
                <span>Less</span>
                {levels.map((l, i) => <div key={i} className={`heatmap-cell ${l}`} />)}
                <span>More</span>
            </div>
        </div>
    );
}

function VelocityWidget() {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    const bars = [45, 62, 38, 75, 81, 58];
    const maxBar = Math.max(...bars);
    return (
        <div className="widget-content">
            <div className="velocity-chart">
                {bars.map((val, i) => (
                    <div key={i} className="velocity-col">
                        <div className="velocity-bar-wrap">
                            <div className="velocity-bar" style={{ height: `${(val / maxBar) * 100}%` }}>
                                <span className="velocity-bar-val">{val}</span>
                            </div>
                        </div>
                        <span className="velocity-label">{weeks[i]}</span>
                    </div>
                ))}
            </div>
            <div className="velocity-footer"><TrendingUp size={12} /><span>+18% vs last week</span></div>
        </div>
    );
}

function TeamWidget() {
    const members = [
        { name: 'Demo User', role: 'Owner', initial: 'D', tasks: 8, online: true },
        { name: 'Alice Chen', role: 'Developer', initial: 'A', tasks: 5, online: true },
        { name: 'Bob Martinez', role: 'Designer', initial: 'B', tasks: 3, online: false },
        { name: 'Carol Wang', role: 'QA', initial: 'C', tasks: 6, online: false },
    ];
    return (
        <div className="widget-content widget-team">
            {members.map((m, i) => (
                <div key={i} className="team-member-row">
                    <div className="team-member-avatar">
                        {m.initial}
                        <span className={`team-online-dot ${m.online ? 'online' : 'offline'}`}></span>
                    </div>
                    <div className="team-member-info">
                        <span className="team-member-name">{m.name}</span>
                        <span className="team-member-role">{m.role}</span>
                    </div>
                    <span className="team-member-tasks">{m.tasks} tasks</span>
                </div>
            ))}
        </div>
    );
}

function SprintWidget({ projects }: { projects: any[] }) {
    const totalTasks = projects.reduce((a, p) => a + p.tasks.length, 0);
    const done = projects.reduce((a, p) => a + p.tasks.filter((t: any) => t.status === 'DONE').length, 0);
    const pct = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0;
    return (
        <div className="widget-content">
            <div className="sprint-info">
                <div className="sprint-name">Sprint 4 — Current</div>
                <div className="sprint-dates"><Calendar size={11} /> Apr 1 – Apr 14, 2026</div>
            </div>
            <div className="sprint-progress-wrap">
                <div className="sprint-progress-bar">
                    <div className="sprint-progress-fill" style={{ width: `${pct}%` }}></div>
                </div>
                <span className="sprint-pct">{pct}%</span>
            </div>
            <div className="sprint-stats">
                <span><CheckCircle size={12} />{done} done</span>
                <span><Clock size={12} />{totalTasks - done} remaining</span>
                <span><AlertCircle size={12} />4 days left</span>
            </div>
        </div>
    );
}

// ── Widget Registry ──────────────────────────────────
const WIDGET_TYPES = [
    { id: 'stats', title: 'Project Stats', icon: <BarChart2 size={13} /> },
    { id: 'activity', title: 'Activity Feed', icon: <Activity size={13} /> },
    { id: 'heatmap', title: 'Contribution Graph', icon: <Activity size={13} /> },
    { id: 'velocity', title: 'Velocity Chart', icon: <TrendingUp size={13} /> },
    { id: 'team', title: 'Team', icon: <Users size={13} /> },
    { id: 'sprint', title: 'Sprint Progress', icon: <Zap size={13} /> },
];

type DashboardLayoutItem = GridLayoutItem & { i: string };

const DEFAULT_LAYOUT: DashboardLayoutItem[] = [
    { i: 'stats', x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'sprint', x: 6, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'heatmap', x: 0, y: 3, w: 7, h: 3, minW: 4, minH: 2 },
    { i: 'velocity', x: 7, y: 3, w: 5, h: 3, minW: 3, minH: 3 },
    { i: 'activity', x: 0, y: 6, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'team', x: 6, y: 6, w: 6, h: 4, minW: 3, minH: 3 },
];

export default function CustomDashboard() {
    const { projects, fetchProjects } = useProjectStore();
    const [layout, setLayout] = useState<DashboardLayoutItem[]>(DEFAULT_LAYOUT);
    const [activeWidgets, setActiveWidgets] = useState(WIDGET_TYPES.map(w => w.id));
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [containerWidth, setContainerWidth] = useState(1200);

    useEffect(() => {
        fetchProjects();
        const el = document.querySelector('.dashboard-canvas');
        if (el) setContainerWidth(el.clientWidth - 32);
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) setContainerWidth(entry.contentRect.width - 32);
        });
        if (el) ro.observe(el);
        return () => ro.disconnect();
    }, [fetchProjects]);

    const removeWidget = (id: string) => setActiveWidgets(prev => prev.filter(w => w !== id));

    const addWidget = (id: string) => {
        if (!activeWidgets.includes(id)) {
            setActiveWidgets(prev => [...prev, id]);
            const existing = layout.find(l => l.i === id);
            if (!existing) {
                setLayout(prev => [...prev, { i: id, x: 0, y: Infinity, w: 4, h: 3, minW: 3, minH: 2 }]);
            }
        }
        setShowAddPanel(false);
    };

    const handleLayoutChange = (newLayout: GridLayoutLayout) => {
        // Merge new positions back into our LayoutItem state
        setLayout(prev => prev.map(item => {
            const updated = newLayout.find((l: GridLayoutItem) => l.i === item.i);
            if (!updated) return item;
            return { ...item, x: updated.x, y: updated.y, w: updated.w, h: updated.h };
        }));
    };

    const renderWidget = (id: string) => {
        const def = WIDGET_TYPES.find(w => w.id === id);
        if (!def) return null;
        let content: React.ReactNode;
        switch (id) {
            case 'stats': content = <StatsWidget projects={projects} />; break;
            case 'activity': content = <ActivityFeedWidget />; break;
            case 'heatmap': content = <HeatmapWidget />; break;
            case 'velocity': content = <VelocityWidget />; break;
            case 'team': content = <TeamWidget />; break;
            case 'sprint': content = <SprintWidget projects={projects} />; break;
            default: content = <div className="widget-content">Widget</div>;
        }
        return (
            <div key={id} className="widget-card">
                <div className="widget-header">
                    <div className="widget-drag-handle"><GripHorizontal size={14} /></div>
                    <span className="widget-title">{def.icon} {def.title}</span>
                    <button className="widget-close-btn" onClick={() => removeWidget(id)} title="Remove widget"><X size={12} /></button>
                </div>
                {content}
            </div>
        );
    };

    // Build the layout array only for active widgets
    const activeLayout = layout.filter(l => activeWidgets.includes(l.i)).map(l => ({
        i: l.i, x: l.x, y: l.y, w: l.w, h: l.h, minW: l.minW, minH: l.minH,
    }));

    return (
        <div className="custom-dashboard">
            <div className="custom-dashboard-header">
                <div>
                    <h1>My Dashboard</h1>
                    <p className="custom-dashboard-sub">Drag, resize, and customize your workspace widgets</p>
                </div>
                <button className="btn btn-primary" id="addWidgetBtn" onClick={() => setShowAddPanel(true)}>
                    <Plus size={14} /> Add Widget
                </button>
            </div>

            <div className="dashboard-canvas">
                <GridLayout
                    className="layout"
                    layout={activeLayout}
                    width={containerWidth}
                    onLayoutChange={handleLayoutChange}
                    gridConfig={{ cols: 12, rowHeight: 80, margin: [12, 12], containerPadding: [0, 0] }}
                    dragConfig={{ enabled: true, handle: '.widget-drag-handle' }}
                    resizeConfig={{ enabled: true, handles: ['se'] }}
                >
                    {activeWidgets.map(id => renderWidget(id))}
                </GridLayout>
            </div>

            {showAddPanel && (
                <div className="modal-overlay" onClick={() => setShowAddPanel(false)}>
                    <div className="card modal-card modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Widget</h3>
                            <button className="modal-close btn" title="Close" onClick={() => setShowAddPanel(false)}><X size={18} /></button>
                        </div>
                        <div className="add-widget-grid">
                            {WIDGET_TYPES.map(w => (
                                <button
                                    key={w.id}
                                    className={`add-widget-item ${activeWidgets.includes(w.id) ? 'add-widget-item-active' : ''}`}
                                    onClick={() => addWidget(w.id)}
                                    disabled={activeWidgets.includes(w.id)}
                                >
                                    <span className="add-widget-icon">{w.icon}</span>
                                    <span className="add-widget-name">{w.title}</span>
                                    {activeWidgets.includes(w.id) && <span className="add-widget-badge">Active</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
