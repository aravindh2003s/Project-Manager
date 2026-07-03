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

### Updates
- **E2E Tests Fixed**: Updated `client/e2e/basic.spec.ts` to match current frontend components.
  - Corrected `Home.tsx` landing page title and "Open Workspace" link locator.
  - Adjusted `Login.tsx` form submit button selector to `button.login-submit`.
  - Updated `Dashboard.tsx` search bar input ID and title class selectors.
  - Consolidated basic UI flows into a sequential test flow with authentication.
- **Upload to Kanban Integration**: Modified `/api/upload` route to automatically create a database Kanban project when a zip file is uploaded, seamlessly syncing uploads to the Dashboard.
- **Auth Fixes**: Updated database seed script (`server/src/seed.ts`) to properly hash user passwords, allowing test accounts to log in successfully.
- **New E2E Tests**: Added `client/e2e/upload.spec.ts` to verify the end-to-end flow of logging in, uploading a zip, and verifying the new project count on the Dashboard.
