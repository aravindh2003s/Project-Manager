"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
const getParam = (value) => Array.isArray(value) ? value[0] : value;
// GET all projects for the demo user
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const user = res.locals.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const workspaces = await auth_1.prisma.workspace.findMany({
            where: { ownerId: user.id },
            include: {
                projects: {
                    skip,
                    take: limit,
                    include: { tasks: { include: { assignee: true } }, columns: { orderBy: { order: 'asc' } } }
                }
            }
        });
        const projects = workspaces.flatMap((w) => w.projects);
        // Approximation of total
        const total = await auth_1.prisma.project.count({ where: { workspace: { ownerId: user.id } } });
        res.json({ data: projects, meta: { total, page, limit } });
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
            data: {
                name,
                description: description || '',
                workspaceId: workspace.id,
                columns: {
                    create: [
                        { name: 'Todo', order: 0 },
                        { name: 'In Progress', order: 1 },
                        { name: 'Done', order: 2 }
                    ]
                }
            },
            include: { tasks: true, columns: { orderBy: { order: 'asc' } } }
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
        const { title, status, columnId, description, priority } = req.body;
        const user = res.locals.user;
        if (!id)
            return res.status(400).json({ error: 'Project id is required' });
        let targetColumnId = columnId;
        if (!targetColumnId) {
            const firstCol = await auth_1.prisma.boardColumn.findFirst({ where: { projectId: id }, orderBy: { order: 'asc' } });
            if (firstCol)
                targetColumnId = firstCol.id;
        }
        const task = await auth_1.prisma.task.create({
            data: {
                title, description, priority: priority || 'MEDIUM',
                status: status || 'TODO',
                columnId: targetColumnId,
                projectId: id, createdById: user.id
            }
        });
        const io = req.app.get('io');
        if (io)
            io.to(id).emit('task_created', task);
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
        const { status, priority, title, description, commitOids, columnId } = req.body;
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
        if (commitOids !== undefined)
            updateData.commitOids = commitOids;
        if (columnId !== undefined)
            updateData.columnId = columnId;
        const task = await auth_1.prisma.task.update({ where: { id: taskId }, data: updateData });
        const io = req.app.get('io');
        const projectId = getParam(req.params.id);
        if (io && projectId)
            io.to(projectId).emit('task_updated', task);
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
        const io = req.app.get('io');
        const projectId = getParam(req.params.id);
        if (io && projectId)
            io.to(projectId).emit('task_deleted', taskId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
// POST create a column
router.post('/:id/columns', auth_1.requireAuth, async (req, res) => {
    try {
        const id = getParam(req.params.id);
        const { name, order } = req.body;
        if (!id)
            return res.status(400).json({ error: 'Project id is required' });
        const column = await auth_1.prisma.boardColumn.create({
            data: { name, order: order || 0, projectId: id }
        });
        res.status(201).json(column);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create column' });
    }
});
// PATCH update column
router.patch('/:id/columns/:colId', auth_1.requireAuth, async (req, res) => {
    try {
        const colId = getParam(req.params.colId);
        const { name, order } = req.body;
        if (!colId)
            return res.status(400).json({ error: 'Column id is required' });
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (order !== undefined)
            updateData.order = order;
        const column = await auth_1.prisma.boardColumn.update({ where: { id: colId }, data: updateData });
        res.json(column);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update column' });
    }
});
// DELETE column
router.delete('/:id/columns/:colId', auth_1.requireAuth, async (req, res) => {
    try {
        const colId = getParam(req.params.colId);
        if (!colId)
            return res.status(400).json({ error: 'Column id is required' });
        // Remove columnId from tasks before deleting the column, or delete tasks?
        // Usually tasks are deleted or moved. Let's just allow deletion.
        await auth_1.prisma.task.updateMany({ where: { columnId: colId }, data: { columnId: null } });
        await auth_1.prisma.boardColumn.delete({ where: { id: colId } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete column' });
    }
});
// POST create a pipeline
router.post('/:id/pipelines', auth_1.requireAuth, async (req, res) => {
    try {
        const id = getParam(req.params.id);
        const { name, yaml, flowState } = req.body;
        const user = res.locals.user;
        if (!id)
            return res.status(400).json({ error: 'Project id is required' });
        const pipeline = await auth_1.prisma.pipeline.create({
            data: {
                name, yaml, flowState,
                projectId: id, createdById: user.id
            }
        });
        res.status(201).json(pipeline);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save pipeline' });
    }
});
// GET pipelines
router.get('/:id/pipelines', auth_1.requireAuth, async (req, res) => {
    try {
        const id = getParam(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        if (!id)
            return res.status(400).json({ error: 'Project id is required' });
        const pipelines = await auth_1.prisma.pipeline.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });
        const total = await auth_1.prisma.pipeline.count({ where: { projectId: id } });
        res.json({ data: pipelines, meta: { total, page, limit } });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch pipelines' });
    }
});
exports.default = router;
