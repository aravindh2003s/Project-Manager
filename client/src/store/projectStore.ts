import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../api/http';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigneeId?: string;
    assignee?: { id: string; name?: string; email: string } | null;
    commitOids?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface Pipeline {
    id: string;
    name: string;
    yaml: string;
    flowState?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    tasks: Task[];
    pipelines?: Pipeline[];
    updatedAt: string;
    createdAt?: string;
}

interface ProjectState {
    projects: Project[];
    currentProject: Project | null;
    loading: boolean;
    error: string | null;
    taskFilter: 'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE';
    taskPriorityFilter: 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';
    searchQuery: string;

    fetchProjects: () => Promise<void>;
    fetchProjectById: (id: string) => Promise<void>;
    createProject: (name: string, description: string) => Promise<void>;
    createTask: (projectId: string, task: Partial<Task>) => Promise<void>;
    updateTaskStatus: (projectId: string, taskId: string, status: string) => Promise<void>;
    updateTask: (projectId: string, taskId: string, patch: Partial<Task>) => Promise<void>;
    deleteTask: (projectId: string, taskId: string) => Promise<void>;
    setTaskFilter: (filter: ProjectState['taskFilter']) => void;
    setTaskPriorityFilter: (filter: ProjectState['taskPriorityFilter']) => void;
    setSearchQuery: (q: string) => void;
    getFilteredTasks: () => Task[];
    getStats: () => { total: number; done: number; inProgress: number; todo: number; completionRate: number };
    
    savePipeline: (projectId: string, payload: { name: string, yaml: string, flowState?: string }) => Promise<void>;
    fetchPipelines: (projectId: string) => Promise<Pipeline[]>;

    // Socket State
    socket: Socket | null;
    initSocket: (projectId: string) => void;
    disconnectSocket: () => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            projects: [],
            currentProject: null,
            loading: false,
            error: null,
            taskFilter: 'ALL',
            taskPriorityFilter: 'ALL',
            searchQuery: '',

            fetchProjects: async () => {
                set({ loading: true, error: null });
                try {
                    const data = await apiFetch<Project[]>('/projects');
                    set({ projects: data, loading: false });
                } catch (error) {
                    set({ loading: false, error: error instanceof Error ? error.message : 'Failed to fetch projects' });
                }
            },

            fetchProjectById: async (id: string) => {
                set({ loading: true, error: null });
                try {
                    const data = await apiFetch<Project>(`/projects/${id}`);
                    set({ currentProject: data, loading: false });
                } catch (error) {
                    set({ loading: false, currentProject: null, error: error instanceof Error ? error.message : 'Failed to fetch project' });
                }
            },

            createProject: async (name: string, description: string) => {
                set({ loading: true, error: null });
                try {
                    await apiFetch('/projects', { method: 'POST' }, { name, description });
                    await get().fetchProjects();
                } catch (error) {
                    set({ loading: false, error: error instanceof Error ? error.message : 'Failed to create project' });
                }
            },

            createTask: async (projectId: string, task: Partial<Task>) => {
                try {
                    await apiFetch(`/projects/${projectId}/tasks`, { method: 'POST' }, task as Record<string, unknown>);
                    // We don't refetch because socket handles the update!
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Failed to create task' });
                }
            },

            updateTaskStatus: async (projectId: string, taskId: string, status: string) => {
                // Optimistic update
                set((state) => {
                    if (!state.currentProject) return state;
                    const updatedTasks = state.currentProject.tasks.map(t =>
                        t.id === taskId ? { ...t, status } : t
                    );
                    return { currentProject: { ...state.currentProject, tasks: updatedTasks } };
                });
                try {
                    await apiFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'PATCH' }, { status });
                } catch (error) {
                    // Revert - refetch
                    get().fetchProjectById(projectId);
                }
            },

            updateTask: async (projectId: string, taskId: string, patch: Partial<Task>) => {
                set((state) => {
                    if (!state.currentProject) return state;
                    const updatedTasks = state.currentProject.tasks.map(t =>
                        t.id === taskId ? { ...t, ...patch } : t
                    );
                    return { currentProject: { ...state.currentProject, tasks: updatedTasks } };
                });
                try {
                    await apiFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'PATCH' }, patch as Record<string, unknown>);
                } catch (error) {
                    get().fetchProjectById(projectId);
                }
            },

            deleteTask: async (projectId: string, taskId: string) => {
                set((state) => {
                    if (!state.currentProject) return state;
                    return {
                        currentProject: {
                            ...state.currentProject,
                            tasks: state.currentProject.tasks.filter(t => t.id !== taskId)
                        }
                    };
                });
                try {
                    await apiFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
                } catch (error) {
                    get().fetchProjectById(projectId);
                }
            },

            setTaskFilter: (filter) => set({ taskFilter: filter }),
            setTaskPriorityFilter: (filter) => set({ taskPriorityFilter: filter }),
            setSearchQuery: (q) => set({ searchQuery: q }),

            getFilteredTasks: () => {
                const { currentProject, taskFilter, taskPriorityFilter, searchQuery } = get();
                if (!currentProject) return [];
                return currentProject.tasks.filter(task => {
                    const matchesStatus = taskFilter === 'ALL' || task.status === taskFilter;
                    const matchesPriority = taskPriorityFilter === 'ALL' || task.priority === taskPriorityFilter;
                    const matchesSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()));
                    return matchesStatus && matchesPriority && matchesSearch;
                });
            },

            getStats: () => {
                const { currentProject } = get();
                if (!currentProject) return { total: 0, done: 0, inProgress: 0, todo: 0, completionRate: 0 };
                const tasks = currentProject.tasks;
                const done = tasks.filter(t => t.status === 'DONE').length;
                const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
                const todo = tasks.filter(t => t.status === 'TODO').length;
                const total = tasks.length;
                return { total, done, inProgress, todo, completionRate: total > 0 ? Math.round((done / total) * 100) : 0 };
            },

            savePipeline: async (projectId: string, payload: { name: string, yaml: string, flowState?: string }) => {
                try {
                    await apiFetch(`/projects/${projectId}/pipelines`, { method: 'POST' }, payload as any);
                } catch (error) {
                    console.error('Failed to save pipeline', error);
                    throw error;
                }
            },
            
            fetchPipelines: async (projectId: string) => {
                try {
                    return await apiFetch<Pipeline[]>(`/projects/${projectId}/pipelines`);
                } catch (error) {
                    console.error('Failed to fetch pipelines', error);
                    return [];
                }
            },

            socket: null,
            initSocket: (projectId: string) => {
                const existing = get().socket;
                if (existing) existing.disconnect();

                // Using same origin if running from same host, or fallback to :3000
                const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '/';
                const socket = io(socketUrl);
                
                socket.on('connect', () => {
                    socket.emit('join_project', projectId);
                });

                socket.on('task_created', (task: Task) => {
                    set((state) => {
                        if (!state.currentProject || state.currentProject.id !== projectId) return state;
                        // prevent duplicates
                        if (state.currentProject.tasks.some(t => t.id === task.id)) return state;
                        return {
                            currentProject: {
                                ...state.currentProject,
                                tasks: [...state.currentProject.tasks, task]
                            }
                        };
                    });
                });

                socket.on('task_updated', (task: Task) => {
                    set((state) => {
                        if (!state.currentProject || state.currentProject.id !== projectId) return state;
                        return {
                            currentProject: {
                                ...state.currentProject,
                                tasks: state.currentProject.tasks.map(t => t.id === task.id ? { ...t, ...task } : t)
                            }
                        };
                    });
                });

                socket.on('task_deleted', (taskId: string) => {
                    set((state) => {
                        if (!state.currentProject || state.currentProject.id !== projectId) return state;
                        return {
                            currentProject: {
                                ...state.currentProject,
                                tasks: state.currentProject.tasks.filter(t => t.id !== taskId)
                            }
                        };
                    });
                });

                set({ socket });
            },
            
            disconnectSocket: () => {
                const { socket } = get();
                if (socket) {
                    socket.disconnect();
                    set({ socket: null });
                }
            }
        }),
        {
            name: 'nexus-project-storage',
            partialize: (state) => Object.fromEntries(
                Object.entries(state).filter(([key]) => !['socket'].includes(key))
            ),
        }
    )
);
