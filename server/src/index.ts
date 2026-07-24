import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import projectRoutes from './routes/projectRoutes';
import gitRoutes from './routes/gitRoutes';
import uploadRoutes from './routes/uploadRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);
    socket.on('join_project', (projectId) => {
        socket.join(projectId);
    });
    socket.on('disconnect', () => {
        console.log('Socket client disconnected:', socket.id);
    });
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/upload', uploadRoutes);

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
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'PMS Server is running' });
});

httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
