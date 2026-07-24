
import { Router } from 'express';
import { requireAuth, prisma } from '../auth';

const router = Router();
const getParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

// GET all projects for the demo user
router.get('/', requireAuth, async (_req, res) => {
    try {
        const user = res.locals.user;

        const workspaces = await prisma.workspace.findMany({
            where: { ownerId: user.id },
            include: { projects: { include: { tasks: { include: { assignee: true } } } } }
        });
        const projects = workspaces.flatMap((w: any) => w.projects);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST create a new project
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const user = res.locals.user;

        let workspace = await prisma.workspace.findFirst({ where: { ownerId: user.id } });
        if (!workspace) {
            workspace = await prisma.workspace.create({
                data: { name: 'Default Workspace', ownerId: user.id, members: { create: { userId: user.id, role: 'ADMIN' } } }
            });
        }

        const project = await prisma.project.create({
            data: { name, description: description || '', workspaceId: workspace.id },
            include: { tasks: true }
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// GET project by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const id = getParam(req.params.id);
        const user = res.locals.user;
        if (!id) return res.status(400).json({ error: 'Project id is required' });
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                tasks: { include: { assignee: true }, orderBy: { createdAt: 'asc' } },
                columns: { orderBy: { order: 'asc' } }
            }
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const workspace = await prisma.workspace.findFirst({ where: { id: project.workspaceId, ownerId: user.id } });
        if (!workspace) return res.status(403).json({ error: 'Access denied' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// POST create a task
router.post('/:id/tasks', requireAuth, async (req, res) => {
    try {
        const id = getParam(req.params.id);
        const { title, status, description, priority } = req.body;
        const user = res.locals.user;
        if (!id) return res.status(400).json({ error: 'Project id is required' });

        const task = await prisma.task.create({
            data: {
                title, description, priority: priority || 'MEDIUM',
                status: status || 'TODO',
                projectId: id, createdById: user.id
            }
        });
        
        const io = req.app.get('io');
        if (io) io.to(id).emit('task_created', task);
        
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PATCH update task
router.patch('/:id/tasks/:taskId', requireAuth, async (req, res) => {
    try {
        const taskId = getParam(req.params.taskId);
        const { status, priority, title, description, commitOids } = req.body;
        if (!taskId) return res.status(400).json({ error: 'Task id is required' });
        const updateData: any = {};
        if (status !== undefined)      updateData.status = status;
        if (priority !== undefined)    updateData.priority = priority;
        if (title !== undefined)       updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (commitOids !== undefined)  updateData.commitOids = commitOids;

        const task = await prisma.task.update({ where: { id: taskId }, data: updateData });
        
        const io = req.app.get('io');
        const projectId = getParam(req.params.id);
        if (io && projectId) io.to(projectId).emit('task_updated', task);
        
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE task
router.delete('/:id/tasks/:taskId', requireAuth, async (req, res) => {
    try {
        const taskId = getParam(req.params.taskId);
        if (!taskId) return res.status(400).json({ error: 'Task id is required' });
        await prisma.task.delete({ where: { id: taskId } });
        
        const io = req.app.get('io');
        const projectId = getParam(req.params.id);
        if (io && projectId) io.to(projectId).emit('task_deleted', taskId);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// POST create a pipeline
router.post('/:id/pipelines', requireAuth, async (req, res) => {
    try {
        const id = getParam(req.params.id);
        const { name, yaml, flowState } = req.body;
        const user = res.locals.user;
        if (!id) return res.status(400).json({ error: 'Project id is required' });

        const pipeline = await prisma.pipeline.create({
            data: {
                name, yaml, flowState,
                projectId: id, createdById: user.id
            }
        });
        res.status(201).json(pipeline);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save pipeline' });
    }
});

// GET pipelines
router.get('/:id/pipelines', requireAuth, async (req, res) => {
    try {
        const id = getParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'Project id is required' });
        
        const pipelines = await prisma.pipeline.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pipelines);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pipelines' });
    }
});

export default router;
