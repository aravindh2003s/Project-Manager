import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../auth';

const router = Router();

const DEFAULT_REPO = path.resolve(__dirname, '../../../');
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

function resolveRepo(repo?: string): string {
    if (!repo || repo === '__default__') return DEFAULT_REPO;
    const target = path.join(UPLOADS_DIR, repo.replace(/\.\.+/g, ''));
    if (!target.startsWith(UPLOADS_DIR)) return DEFAULT_REPO;
    return fs.existsSync(target) ? target : DEFAULT_REPO;
}

// GET /api/pipeline/analyze?project=<project_name>
router.get('/analyze', requireAuth, async (req, res) => {
    try {
        const dir = resolveRepo(req.query.project as string | undefined);
        const isDefault = dir === DEFAULT_REPO;

        // Features detected
        let hasNode = false;
        let hasPython = false;
        let hasJava = false;
        let hasDocker = false;
        let hasPrisma = false;

        // Check for specific files
        if (fs.existsSync(path.join(dir, 'package.json'))) hasNode = true;
        if (fs.existsSync(path.join(dir, 'requirements.txt')) || fs.existsSync(path.join(dir, 'pyproject.toml'))) hasPython = true;
        if (fs.existsSync(path.join(dir, 'pom.xml')) || fs.existsSync(path.join(dir, 'build.gradle'))) hasJava = true;
        if (fs.existsSync(path.join(dir, 'Dockerfile'))) hasDocker = true;
        if (fs.existsSync(path.join(dir, 'prisma', 'schema.prisma')) || fs.existsSync(path.join(dir, 'schema.prisma'))) hasPrisma = true;
        // In this project structure, maybe server has Prisma
        if (isDefault && fs.existsSync(path.join(dir, 'server', 'prisma', 'schema.prisma'))) hasPrisma = true;

        // Build the nodes array
        const nodes: any[] = [];
        const edges: any[] = [];
        let yPos = 150;
        
        let nodeId = 1;
        // Every pipeline starts with Trigger
        nodes.push({ id: String(nodeId), type: 'pipelineNode', position: { x: 50, y: yPos }, data: { label: 'Trigger', type: 'trigger', config: { on: 'push', branches: 'main' } } });
        const triggerId = String(nodeId);
        nodeId++;
        
        let currentX = 350;
        let prevNodeIds: string[] = [triggerId];

        const addStage = (nodesData: { type: string, label: string, config: any, offset?: number }[]) => {
            const currentStageIds: string[] = [];
            nodesData.forEach((nd, i) => {
                const id = String(nodeId++);
                const yOffset = nd.offset !== undefined ? nd.offset : (i * 100);
                nodes.push({
                    id, type: 'pipelineNode', position: { x: currentX, y: yPos - 50 + yOffset }, data: { label: nd.label, type: nd.type, config: nd.config }
                });
                currentStageIds.push(id);
                // Connect from all previous stage nodes
                prevNodeIds.forEach(prevId => {
                    edges.push({ id: `e${prevId}-${id}`, source: prevId, target: id, type: 'smoothstep', animated: true });
                });
            });
            prevNodeIds = currentStageIds;
            currentX += 300;
        };

        // Code quality / Test stage
        const testStage = [];
        if (hasNode || isDefault) {
            testStage.push({ type: 'lint', label: 'Lint (Node)', config: { command: 'npm run lint', runs_on: 'ubuntu-latest' }, offset: 0 });
            testStage.push({ type: 'test', label: 'Unit Tests', config: { command: 'npm test', runs_on: 'ubuntu-latest' }, offset: 100 });
        } else if (hasPython) {
            testStage.push({ type: 'lint', label: 'Lint (Python)', config: { command: 'flake8 .', runs_on: 'ubuntu-latest' }, offset: 0 });
            testStage.push({ type: 'test', label: 'PyTest', config: { command: 'pytest', runs_on: 'ubuntu-latest' }, offset: 100 });
        } else if (hasJava) {
            testStage.push({ type: 'test', label: 'JUnit Tests', config: { command: 'mvn test', runs_on: 'ubuntu-latest' }, offset: 0 });
        } else {
            testStage.push({ type: 'test', label: 'Basic Tests', config: { command: 'make test', runs_on: 'ubuntu-latest' }, offset: 0 });
        }
        testStage.push({ type: 'security', label: 'Security Scan', config: { scanner: 'snyk', fail_on: 'high' }, offset: 200 });
        addStage(testStage);

        // Build stage
        const buildStage = [];
        if (hasDocker) {
            buildStage.push({ type: 'docker', label: 'Docker Build', config: { image: 'app-image', tag: '${{ github.sha }}' }, offset: 0 });
        } else if (hasNode || isDefault) {
            buildStage.push({ type: 'build', label: 'Build App', config: { command: 'npm run build', artifact: 'dist/' }, offset: 0 });
        } else if (hasJava) {
            buildStage.push({ type: 'build', label: 'Maven Build', config: { command: 'mvn package', artifact: 'target/' }, offset: 0 });
        }
        
        if (buildStage.length > 0) {
            addStage(buildStage);
        }

        // Deploy stage
        const deployStage = [];
        if (hasPrisma) {
            deployStage.push({ type: 'database', label: 'DB Migrate', config: { command: 'npx prisma migrate deploy', env: 'production' }, offset: 0 });
            deployStage.push({ type: 'deploy', label: 'Deploy to Cloud', config: { target: 'AWS ECS', region: 'us-east-1', environment: 'production' }, offset: 100 });
        } else {
            deployStage.push({ type: 'deploy', label: 'Deploy to Cloud', config: { target: 'Vercel', region: 'global', environment: 'production' }, offset: 0 });
        }
        addStage(deployStage);
        
        // Notify stage
        addStage([{ type: 'notify', label: 'Notify Team', config: { channel: '#deployments', on: 'success,failure' }, offset: 0 }]);

        res.json({
            nodes,
            edges,
            stack: { hasNode, hasPython, hasJava, hasDocker, hasPrisma }
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
