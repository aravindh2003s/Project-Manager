"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Create a Demo User
    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            name: 'Demo User',
            password: 'hashed_password_here', // In real app, hash this!
        },
    });
    console.log('Created user:', user.name);
    // Create a Workspace
    const workspace = await prisma.workspace.create({
        data: {
            name: 'Personal Projects',
            ownerId: user.id,
            members: {
                create: {
                    userId: user.id,
                    role: 'ADMIN',
                },
            },
        },
    });
    console.log('Created workspace:', workspace.name);
    // Create a Project
    const project = await prisma.project.create({
        data: {
            name: 'Antigravity PMS',
            description: 'Building the best project management tool.',
            workspaceId: workspace.id,
            columns: {
                create: [
                    { name: 'To Do', order: 0 },
                    { name: 'In Progress', order: 1 },
                    { name: 'Done', order: 2 },
                ],
            },
        },
    });
    console.log('Created project:', project.name);
    // Create some tasks
    await prisma.task.create({
        data: {
            title: 'Setup Environment',
            status: 'DONE',
            projectId: project.id,
            createdById: user.id,
        },
    });
    await prisma.task.create({
        data: {
            title: 'Build UI',
            status: 'IN_PROGRESS',
            projectId: project.id,
            createdById: user.id,
        },
    });
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
