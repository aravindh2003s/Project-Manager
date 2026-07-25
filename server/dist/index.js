"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const gitRoutes_1 = __importDefault(require("./routes/gitRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const pipelineRoutes_1 = __importDefault(require("./routes/pipelineRoutes"));
const pipelineRunRoutes_1 = __importDefault(require("./routes/pipelineRunRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*' }
});
app.set('io', io);
io.on('connection', (socket) => {
    logger_1.logger.info(`Socket client connected: ${socket.id}`);
    socket.on('join_project', (projectId) => {
        socket.join(projectId);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`Socket client disconnected: ${socket.id}`);
    });
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/git', gitRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/pipeline', pipelineRoutes_1.default);
app.use('/api/pipelines', pipelineRunRoutes_1.default);
// Temporary seed route
app.post('/seed', async (req, res) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
        // Create user
        const user = await prisma.user.upsert({
            where: { email: 'demo@example.com' },
            update: {},
            create: { email: 'demo@example.com', name: 'Demo User', password: 'hashed_password' }
        });
        // Create workspace
        const workspace = await prisma.workspace.create({
            data: {
                name: 'Main Workspace',
                ownerId: user.id,
                members: { create: { userId: user.id, role: 'ADMIN' } }
            }
        });
        // Create Project
        const project = await prisma.project.create({
            data: {
                name: 'Antigravity PMS',
                description: 'Full stack project',
                workspaceId: workspace.id,
                tasks: {
                    create: [
                        { title: 'Setup', status: 'DONE', createdById: user.id },
                        { title: 'Develop', status: 'IN_PROGRESS', createdById: user.id }
                    ]
                }
            }
        });
        res.json({ message: 'Seeded!', projectId: project.id });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'PMS Server is running' });
});
app.use(errorHandler_1.errorHandler);
httpServer.listen(port, () => {
    logger_1.logger.info(`Server running on http://localhost:${port}`);
});
