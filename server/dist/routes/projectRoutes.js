"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
const getParam = (value) => Array.isArray(value) ? value[0] : value;
// GET all projects for the demo user
router.get('/', auth_1.requireAuth, async (_req, res) => {
    try {
        const user = res.locals.user;
        const workspaces = await auth_1.prisma.workspace.findMany({
            where: { ownerId: user.id },
            include: { projects: { include: { tasks: { include: { assignee: true } } } } }
        });
        const projects = workspaces.flatMap((w) => w.projects);
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
// POST create a new project
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const user = res.locals.user;
        let workspace = await auth_1.prisma.workspace.findFirst({ where: { ownerId: user.id } });
        if (!workspace) {
            workspace = await auth_1.prisma.workspace.create({
                data: { name: 'Default Workspace', ownerId: user.id, members: { create: { userId: user.id, role: 'ADMIN' } } }
            });
        }
        const project = await auth_1.prisma.project.create({
            data: { name, description: description || '', workspaceId: workspace.id },
            include: { tasks: true }
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});
// GET project by ID
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const id = getParam(req.params.id);
        const user = res.locals.user;
        if (!id)
            return res.status(400).json({ error: 'Project id is required' });
        const project = await auth_1.prisma.project.findUnique({
            where: { id },
            include: {
                tasks: { include: { assignee: true }, orderBy: { createdAt: 'asc' } },
                columns: { orderBy: { order: 'asc' } }
            }
        });
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        const workspace = await auth_1.prisma.workspace.findFirst({ where: { id: project.workspaceId, ownerId: user.id } });
        if (!workspace)
            return res.status(403).json({ error: 'Access denied' });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
// POST create a task
router.post('/:id/tasks', auth_1.requireAuth, async (req, res) => {
    try {
        const id = getParam(req.params.id);
        const { title, status, description, priority } = req.body;
        const user = res.locals.user;
        if (!id)
            return res.status(400).json({ error: 'Project id is required' });
        const task = await auth_1.prisma.task.create({
            data: {
                title, description, priority: priority || 'MEDIUM',
                status: status || 'TODO',
                projectId: id, createdById: user.id
            }
        });
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});
// PATCH update task
router.patch('/:id/tasks/:taskId', auth_1.requireAuth, async (req, res) => {
    try {
        const taskId = getParam(req.params.taskId);
        const { status, priority, title, description } = req.body;
        if (!taskId)
            return res.status(400).json({ error: 'Task id is required' });
        const updateData = {};
        if (status !== undefined)
            updateData.status = status;
        if (priority !== undefined)
            updateData.priority = priority;
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        const task = await auth_1.prisma.task.update({ where: { id: taskId }, data: updateData });
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});
// DELETE task
router.delete('/:id/tasks/:taskId', auth_1.requireAuth, async (req, res) => {
    try {
        const taskId = getParam(req.params.taskId);
        if (!taskId)
            return res.status(400).json({ error: 'Task id is required' });
        await auth_1.prisma.task.delete({ where: { id: taskId } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
exports.default = router;
