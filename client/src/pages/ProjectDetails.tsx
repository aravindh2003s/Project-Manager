import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import type { Task } from '../store/projectStore';
import {
    KanbanSquare, List, BarChart2, GitCommit, Plus, X, Search,
    Filter, CheckCircle, Circle, AlertCircle,
    Edit3, Trash2, Flag, ArrowUpDown
} from 'lucide-react';
import { DndContext, type DragEndEvent, closestCorners, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { apiFetch } from '../api/http';
import { DiffViewer } from '../components/DiffViewer';
import './ProjectDetails.css';

const PRIORITY_MAP: Record<string, { label: string; className: string }> = {
    HIGH:   { label: 'High',   className: 'priority-high' },
    MEDIUM: { label: 'Medium', className: 'priority-medium' },
    LOW:    { label: 'Low',    className: 'priority-low' },
};

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
    TODO:        { label: 'Todo',        icon: <Circle size={14} /> },
    IN_PROGRESS: { label: 'In Progress', icon: <ArrowUpDown size={14} /> },
    DONE:        { label: 'Done',        icon: <CheckCircle size={14} /> },
};

function ProjectDetails() {
    const { projectId } = useParams<{ projectId: string }>();
    const {
        currentProject, loading,
        fetchProjectById, createTask, updateTaskStatus,
        updateTask, deleteTask,
        taskFilter, taskPriorityFilter, searchQuery,
        setTaskFilter, setTaskPriorityFilter, setSearchQuery,
        getFilteredTasks, getStats,
        initSocket, disconnectSocket
    } = useProjectStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
    const [activeTab, setActiveTab] = useState('board');
    const [availableCommits, setAvailableCommits] = useState<any[]>([]);
    const [editTaskCommitOids, setEditTaskCommitOids] = useState<string[]>([]);
    
    // Diff Viewer State
    const [viewingDiffOid, setViewingDiffOid] = useState<string | null>(null);
    const [diffPatch, setDiffPatch] = useState<string>('');

    useEffect(() => {
        if (editTask && currentProject) {
            setEditTaskCommitOids(editTask.commitOids ? editTask.commitOids.split(',').filter(Boolean) : []);
            
            const fetchCommits = async () => {
                try {
                    const res = await fetch(`/api/git/commits?repo=${encodeURIComponent(currentProject.name)}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setAvailableCommits(data);
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            fetchCommits();
        }
    }, [editTask, currentProject]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => {
        if (projectId) {
            fetchProjectById(projectId);
            initSocket(projectId);
        }
        return () => { 
            setSearchQuery('');
            disconnectSocket();
        };
    }, [projectId, fetchProjectById, setSearchQuery, initSocket, disconnectSocket]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !projectId) return;
        await createTask(projectId, { title: newTaskTitle, description: newTaskDesc, status: 'TODO', priority: newTaskPriority });
        setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskPriority('MEDIUM');
        setIsModalOpen(false);
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTask || !projectId) return;
        const commitOidsStr = editTaskCommitOids.length > 0 ? editTaskCommitOids.join(',') : null;
        
        await updateTask(projectId, editTask.id, { 
            ...editTask, 
            commitOids: commitOidsStr 
        });
        setEditTask(null);
    };

    const handleViewDiff = async (e: React.MouseEvent, oid: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentProject) return;
        try {
            const res = await apiFetch<{ patch: string }>(`/git/diff?repo=${currentProject.name}&oid=${oid}`);
            setDiffPatch(res.patch || '');
            setViewingDiffOid(oid);
        } catch (err) {
            console.error('Failed to fetch diff', err);
        }
    };

    const toggleCommit = (oid: string) => {
        setEditTaskCommitOids(prev => prev.includes(oid) ? prev.filter(c => c !== oid) : [...prev, oid]);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !currentProject || !projectId) return;
        const taskId = active.id as string;
        let newStatus = over.id as string;
        if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(newStatus)) {
            const overTask = currentProject.tasks.find(t => t.id === newStatus);
            if (overTask) newStatus = overTask.status;
            else return;
        }
        const activeTask = currentProject.tasks.find(t => t.id === taskId);
        if (activeTask && activeTask.status !== newStatus) {
            await updateTaskStatus(projectId, taskId, newStatus);
        }
    };

    const stats = getStats();
    const filteredTasks = getFilteredTasks();

    if (loading) return (
        <div className="pd-loading">
            <div className="skeleton-line w60"></div>
            <div className="skeleton-line w40"></div>
            <div className="pd-skeleton-board">
                {[1,2,3].map(i => <div key={i} className="skeleton-col"></div>)}
            </div>
        </div>
    );
    if (!currentProject) return (
        <div className="pd-not-found">
            <AlertCircle size={48} />
            <h2>Project not found</h2>
            <p>This project may have been deleted or the link is invalid.</p>
        </div>
    );

    return (
        <div className="pd-container">
            <header className="pd-header">
                <div className="pd-breadcrumb">
                    <a href="/app" className="pd-breadcrumb-link">Projects</a>
                    <span className="pd-breadcrumb-sep">/</span>
                    <span className="pd-breadcrumb-current">{currentProject.name}</span>
                </div>
                <div className="pd-title-row">
                    <div>
                        <h1 className="pd-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {currentProject.name}
                            <span className="live-badge" title="Live Collaboration Active">
                                <span className="live-dot"></span> Live
                            </span>
                        </h1>
                        {currentProject.description && <p className="pd-subtitle">{currentProject.description}</p>}
                    </div>
                    <button className="btn btn-primary" id="newItemBtn" title="Create new issue" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} /> New Issue
                    </button>
                </div>

                <div className="pd-stats-strip">
                    <div className="pd-stat"><Circle size={12} className="color-muted" /> <span>{stats.todo} Open</span></div>
                    <div className="pd-stat"><ArrowUpDown size={12} className="color-warning" /> <span>{stats.inProgress} In Progress</span></div>
                    <div className="pd-stat"><CheckCircle size={12} className="color-success" /> <span>{stats.done} Closed</span></div>
                    <div className="pd-stat-progress">
                        <div className="progress-track pd-stat-track">
                            <div className="progress-fill" style={{ width: `${stats.completionRate}%` }}></div>
                        </div>
                        <span className="pd-stat-pct">{stats.completionRate}%</span>
                    </div>
                </div>

                <div className="pd-tabs">
                    {[
                        { id: 'board',     icon: <KanbanSquare size={15} />, label: 'Board' },
                        { id: 'list',      icon: <List size={15} />,         label: 'List'  },
                        { id: 'sprints',   icon: <BarChart2 size={15} />,    label: 'Sprints'},
                        { id: 'commits',   icon: <GitCommit size={15} />,    label: 'Commits'},
                        { id: 'pipelines', icon: <ArrowUpDown size={15} />,  label: 'Pipelines'},
                    ].map(tab => (
                        <button key={tab.id}
                            className={`tab-item ${activeTab === tab.id ? 'active' : 'inactive'}`}
                            onClick={() => setActiveTab(tab.id)}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {(activeTab === 'board' || activeTab === 'list') && (
                <div className="pd-filterbar">
                    <div className="pd-filterbar-search">
                        <Search size={13} />
                        <input id="taskSearch" type="text" placeholder="Search issues…" value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)} className="pd-filter-input" />
                        {searchQuery && <button title="Clear search" onClick={() => setSearchQuery('')}><X size={12} /></button>}
                    </div>
                    <div className="pd-filters">
                        <div className="pd-filter-group">
                            <Filter size={13} />
                            {(['ALL','TODO','IN_PROGRESS','DONE'] as const).map(s => (
                                <button key={s} className={`pd-filter-chip ${taskFilter === s ? 'active' : ''}`}
                                    onClick={() => setTaskFilter(s)}>
                                    {s === 'ALL' ? 'All' : STATUS_MAP[s]?.label}
                                </button>
                            ))}
                        </div>
                        <div className="pd-filter-group">
                            <Flag size={13} />
                            {(['ALL','HIGH','MEDIUM','LOW'] as const).map(p => (
                                <button key={p} className={`pd-filter-chip ${taskPriorityFilter === p ? 'active' : ''}`}
                                    onClick={() => setTaskPriorityFilter(p)}>
                                    {p === 'ALL' ? 'Any Priority' : PRIORITY_MAP[p]?.label}
                                </button>
                            ))}
                        </div>
                        <span className="pd-filter-count">{filteredTasks.length} issues</span>
                    </div>
                </div>
            )}

            <div className={`pd-content ${activeTab === 'board' ? 'overflow-x-auto' : 'overflow-x-hidden'}`}>
                {activeTab === 'board' && (
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                        <div className="board-container">
                            {(['TODO','IN_PROGRESS','DONE'] as const).map(status => (
                                <BoardColumn key={status} title={STATUS_MAP[status].label} status={status}
                                    tasks={filteredTasks.filter(t => t.status === status)}
                                    onEdit={setEditTask}
                                    onDelete={(tid) => projectId && deleteTask(projectId, tid)} />
                            ))}
                        </div>
                    </DndContext>
                )}

                {activeTab === 'list' && (
                    <div className="list-view">
                        <div className="list-header-row">
                            <span>Title</span><span>Status</span><span>Priority</span><span>Actions</span>
                        </div>
                        {filteredTasks.length === 0 && <div className="list-empty">No issues match your filters.</div>}
                        {filteredTasks.map(task => (
                            <div key={task.id} className="list-row">
                                <div className="list-row-title">
                                    {STATUS_MAP[task.status]?.icon}
                                    <span>{task.title}</span>
                                    {task.description && <p className="list-row-desc">{task.description}</p>}
                                </div>
                                <div><span className={`status-badge status-${task.status.toLowerCase()}`}>{STATUS_MAP[task.status]?.label}</span></div>
                                <div><span className={`priority-badge ${PRIORITY_MAP[task.priority]?.className}`}><Flag size={11} /> {PRIORITY_MAP[task.priority]?.label}</span></div>
                                <div className="list-row-actions">
                                    <button className="icon-action-btn" title="Edit task" onClick={() => setEditTask(task)}><Edit3 size={14} /></button>
                                    <button className="icon-action-btn danger" title="Delete task" onClick={() => projectId && deleteTask(projectId, task.id)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'sprints' && (
                    <div className="card sprint-card">
                        <h3 className="sprint-card-title">Current Sprint (Sprint 4)</h3>
                        <div className="sprint-progress-container">
                            <div className="sprint-progress-text">
                                <span>Jan 24 – Feb 7</span><span>{stats.done}/{stats.total} completed</span>
                            </div>
                            <div className="sprint-progress-bg">
                                <div className="sprint-progress-bar" style={{ width: `${stats.completionRate}%` }}></div>
                            </div>
                        </div>
                        <h4>Sprint Items</h4>
                        <div className="sprint-tasks-list">
                            {currentProject.tasks.map(task => (
                                <div key={task.id} className="sprint-task-item">
                                    <div className="sprint-task-left">{STATUS_MAP[task.status]?.icon}<span>{task.title}</span></div>
                                    <div className="sprint-task-right">
                                        <span className={`priority-badge ${PRIORITY_MAP[task.priority]?.className}`}>{PRIORITY_MAP[task.priority]?.label}</span>
                                        <span className={`status-badge status-${task.status.toLowerCase()}`}>{STATUS_MAP[task.status]?.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'commits' && (
                    <div className="card sprint-card">
                        <h3 className="sprint-card-title">Activity & Commits</h3>
                        <div className="commit-list">
                            <CommitItem message="Initial project setup" author="Demo User" hash="a1b2c3d" time="2 hours ago" branch="main" />
                            <CommitItem message="Created database schema" author="Demo User" hash="e4f5g6h" time="1 hour ago" branch="feat/db" />
                            <CommitItem message="Added Create Task feature" author="Demo User" hash="i7j8k9l" time="Just now" branch="feat/tasks" />
                        </div>
                    </div>
                )}

                {activeTab === 'pipelines' && (
                    <div className="card sprint-card">
                        <h3 className="sprint-card-title">CI/CD Pipelines</h3>
                        <div className="commit-list">
                            <PipelineItem name="Build & Test" status="success" time="10 min ago" duration="2m 30s" branch="main" />
                            <PipelineItem name="Deploy to Staging" status="success" time="15 min ago" duration="4m 10s" branch="main" />
                            <PipelineItem name="E2E Tests" status="failed" time="1 hour ago" duration="5m 00s" branch="feat/tasks" />
                            <PipelineItem name="Deploy to Production" status="running" time="Just now" duration="—" branch="main" />
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="card modal-card modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">New Issue</h3>
                            <button className="modal-close btn" title="Close modal" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateTask} className="modal-form">
                            <label className="form-label" htmlFor="taskTitle">Title *</label>
                            <input id="taskTitle" autoFocus required placeholder="Issue title" value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)} className="modal-input" />
                            <label className="form-label" htmlFor="taskDesc">Description</label>
                            <textarea id="taskDesc" placeholder="Add a description…" value={newTaskDesc}
                                onChange={e => setNewTaskDesc(e.target.value)} className="modal-input modal-textarea" rows={3} />
                            <label className="form-label" htmlFor="taskPriority">Priority</label>
                            <select id="taskPriority" title="Priority" value={newTaskPriority}
                                onChange={e => setNewTaskPriority(e.target.value)} className="modal-input modal-select">
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Issue</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editTask && (
                <div className="modal-overlay" onClick={() => setEditTask(null)}>
                    <div className="card modal-card modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Issue</h3>
                            <button className="modal-close btn" title="Close modal" onClick={() => setEditTask(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditSave} className="modal-form">
                            <label className="form-label" htmlFor="editTitle">Title *</label>
                            <input id="editTitle" required value={editTask.title}
                                onChange={e => setEditTask({ ...editTask, title: e.target.value })} className="modal-input" />
                            <label className="form-label" htmlFor="editDesc">Description</label>
                            <textarea id="editDesc" value={editTask.description || ''}
                                onChange={e => setEditTask({ ...editTask, description: e.target.value })}
                                className="modal-input modal-textarea" rows={3} />
                            <div className="modal-two-col">
                                <div>
                                    <label className="form-label" htmlFor="editStatus">Status</label>
                                    <select id="editStatus" title="Status" value={editTask.status}
                                        onChange={e => setEditTask({ ...editTask, status: e.target.value })} className="modal-input modal-select">
                                        <option value="TODO">Todo</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" htmlFor="editPriority">Priority</label>
                                    <select id="editPriority" title="Priority" value={editTask.priority}
                                        onChange={e => setEditTask({ ...editTask, priority: e.target.value })} className="modal-input modal-select">
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                            </div>
                            {availableCommits.length > 0 && (
                                <div className="modal-commits-section">
                                    <label className="form-label">Link Commits (DevOps Traceability)</label>
                                    <div className="commits-selector">
                                        {availableCommits.map(c => (
                                            <div key={c.oid} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <label className="commit-checkbox-item" style={{ flex: 1, margin: 0 }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={editTaskCommitOids.includes(c.oid)}
                                                        onChange={() => toggleCommit(c.oid)}
                                                    />
                                                    <GitCommit size={14} className="color-muted" />
                                                    <span className="commit-message-short">{c.message.split('\n')[0]}</span>
                                                    <span className="commit-hash-short">{c.oid.substring(0, 7)}</span>
                                                </label>
                                                <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={(e) => handleViewDiff(e, c.oid)}>
                                                    View Code
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setEditTask(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingDiffOid && (
                <DiffViewer 
                    patch={diffPatch} 
                    onClose={() => setViewingDiffOid(null)} 
                />
            )}
        </div>
    );
}

function CommitItem({ message, author, hash, time, branch }: { message: string, author: string, hash: string, time: string, branch: string }) {
    return (
        <div className="commit-item">
            <GitCommit size={18} className="commit-icon color-muted" />
            <div className="commit-body">
                <div className="commit-message">{message}<span className="commit-hash">{hash}</span></div>
                <div className="commit-meta text-sm text-muted">
                    {author} committed {time} on <span className="commit-branch">{branch}</span>
                </div>
            </div>
        </div>
    );
}

function PipelineItem({ name, status, time, duration, branch }: { name: string, status: string, time: string, duration: string, branch: string }) {
    const statusClass = status === 'success' ? 'bg-success' : status === 'failed' ? 'bg-danger' : 'bg-warning';
    return (
        <div className="pipeline-item">
            <div className="pipeline-status">
                <div className={`pipeline-dot ${statusClass} ${status === 'running' ? 'pipeline-dot-pulse' : ''}`}></div>
                <div>
                    <div className="pipeline-name">{name}</div>
                    <div className="text-sm text-muted">{time} · <span className="commit-branch">{branch}</span></div>
                </div>
            </div>
            <div className="pipeline-right">
                <span className={`pipeline-status-badge ${status}`}>{status}</span>
                <span className="text-sm text-muted">{duration}</span>
            </div>
        </div>
    );
}

function BoardColumn({ title, status, tasks, onEdit, onDelete }: {
    title: string, status: string, tasks: Task[], onEdit: (t: Task) => void, onDelete: (id: string) => void
}) {
    const { setNodeRef } = useDroppable({ id: status });
    const statusIconMap: Record<string, React.ReactNode> = {
        TODO: <Circle size={14} />, IN_PROGRESS: <ArrowUpDown size={14} />, DONE: <CheckCircle size={14} />
    };
    return (
        <div ref={setNodeRef} className={`board-col board-col-${status.toLowerCase()}`}>
            <div className="board-col-header">
                <div className="board-col-title">{statusIconMap[status]}<span>{title}</span></div>
                <span className="board-col-count">{tasks.length}</span>
            </div>
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="board-col-tasks">
                    {tasks.map(task => <SortableTask key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />)}
                </div>
            </SortableContext>
        </div>
    );
}

function SortableTask({ task, onEdit, onDelete }: { task: Task, onEdit: (t: Task) => void, onDelete: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const dndStyle = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} className={`task-card ${isDragging ? 'task-card-dragging' : ''}`}
            {...{ style: dndStyle }} {...attributes} {...listeners}>
            <div className="task-header">
                <span className="task-title">{task.title}</span>
                <span className={`task-priority priority-badge ${PRIORITY_MAP[task.priority]?.className}`}>
                    <Flag size={10} /> {PRIORITY_MAP[task.priority]?.label}
                </span>
            </div>
            {task.description && <p className="task-desc">{task.description}</p>}
            
            <div className="task-footer">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="task-id text-muted">#{task.id?.slice(0,6)}</span>
                    {task.commitOids && task.commitOids.length > 0 && (
                        <span className="task-commits-badge" title="Linked Commits">
                            <GitCommit size={11} /> {task.commitOids.split(',').filter(Boolean).length}
                        </span>
                    )}
                </div>
                <div className="task-actions">
                    <button className="icon-action-btn" title="Edit task" onPointerDown={e => e.stopPropagation()} onClick={() => onEdit(task)}><Edit3 size={12} /></button>
                    <button className="icon-action-btn danger" title="Delete task" onPointerDown={e => e.stopPropagation()} onClick={() => onDelete(task.id)}><Trash2 size={12} /></button>
                </div>
            </div>
        </div>
    );
}

export default ProjectDetails;
