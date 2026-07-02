# Antigravity PMS

## Getting Started

### Prerequisites
- Node.js (LTS)
- Git

### Installation

1.  **Clone/Open the repository**
2.  **Install Dependencies**

    ```bash
    # Install Server Dependencies
    cd server
    npm install

    # Install Client Dependencies
    cd ../client
    npm install
    ```

3.  **Database Setup**

    ```bash
    cd server
    # Generate Prisma Client
    npx prisma generate
    # Push Schema to DB
    npx prisma db push
    # Seed the Database (Optional, for demo data)
    npx ts-node src/seed.ts
    ```

### Running the Project

You will need two separate terminal windows.

**Terminal 1: Server**
```bash
cd server
npm run dev
```
*Server runs on http://localhost:3000*

**Terminal 2: Client**
```bash
cd client
npm run dev
```
*Client runs on http://localhost:5173*

### Features
- **Project Management**: Create workspaces and projects.
- **Kanban Board**: Drag-and-drop tasks between columns.
- **Task Management**: Create tasks with priorities (Low, Medium, High).
- **Mock Views**: Sprints, Commits, and CI/CD Pipelines.
