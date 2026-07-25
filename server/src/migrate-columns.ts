import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Migrating existing tasks and projects to dynamic columns...');
    
    const projects = await prisma.project.findMany({ include: { columns: true, tasks: true } });
    
    for (const project of projects) {
        let todoCol = project.columns.find(c => c.name === 'Todo' || c.name === 'TODO');
        let inProgressCol = project.columns.find(c => c.name === 'In Progress' || c.name === 'IN_PROGRESS');
        let doneCol = project.columns.find(c => c.name === 'Done' || c.name === 'DONE');
        
        if (!todoCol) todoCol = await prisma.boardColumn.create({ data: { name: 'Todo', order: 0, projectId: project.id } });
        if (!inProgressCol) inProgressCol = await prisma.boardColumn.create({ data: { name: 'In Progress', order: 1, projectId: project.id } });
        if (!doneCol) doneCol = await prisma.boardColumn.create({ data: { name: 'Done', order: 2, projectId: project.id } });
        
        for (const task of project.tasks) {
            if (!task.columnId) {
                let targetColId = todoCol.id;
                if (task.status === 'IN_PROGRESS') targetColId = inProgressCol.id;
                if (task.status === 'DONE') targetColId = doneCol.id;
                
                await prisma.task.update({
                    where: { id: task.id },
                    data: { columnId: targetColId, status: task.status }
                });
            }
        }
    }
    
    console.log('Migration complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
