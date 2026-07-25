import { Router } from 'express';
import { requireAuth } from '../auth';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// GET /api/pipelines/runs?project=<project_id>
router.get('/runs', requireAuth, async (req, res, next) => {
    try {
        const projectId = req.query.project as string;
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        const runs = await prisma.pipelineRun.findMany({
            where: {
                pipeline: {
                    projectId: projectId
                }
            },
            include: {
                pipeline: {
                    select: { name: true }
                },
                triggeredBy: {
                    select: { name: true, email: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });

        res.json(runs);
    } catch (err) {
        next(err);
    }
});

// GET /api/pipelines/runs/:runId/logs
router.get('/runs/:runId/logs', requireAuth, async (req, res, next) => {
    try {
        const runId = req.params.runId as string;
        const logs = await prisma.executionLog.findMany({
            where: { runId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(logs);
    } catch (err) {
        next(err);
    }
});

export default router;
