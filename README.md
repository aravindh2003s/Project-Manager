# 🚀 Antigravity Project Management System (PMS)

![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/-Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)

A full-stack project management application featuring a Kanban board, task tracking, and workspace management.

## 🌟 Features
- **Project Management**: Create workspaces and organize multiple projects.
- **Kanban Board**: Interactive drag-and-drop board for moving tasks between columns.
- **Task Management**: Create detailed tasks with priorities (Low, Medium, High).
- **Mock Views**: Dedicated views for Sprints, Commits, and CI/CD Pipelines.
- **File Upload Integration**: Automatically create database projects when zip files are uploaded.

## 📸 Screenshots
*(Add screenshots of your application here. You can upload them to the repo and link them like this: `![Dashboard](./assets/dashboard.png)`)*

## 🛠️ Getting Started

### Prerequisites
Make sure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (LTS Version)
- Git

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/aravindh2003s/Project-Manager.git
   cd Project-Manager
   ```

2. **Install Dependencies**
   ```bash
   # Install Server Dependencies
   cd server
   npm install

   # Install Client Dependencies
   cd ../client
   npm install
   ```

3. **Database Setup**
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   # Seed the Database with demo data (Optional)
   npx ts-node src/seed.ts
   ```

## 🚀 Running the Application

You will need two separate terminal windows to run both the frontend and backend concurrently.

**Terminal 1: Start the Backend Server**
```bash
cd server
npm run dev
```
*The server will start running on http://localhost:3000*

**Terminal 2: Start the Frontend Client**
```bash
cd client
npm run dev
```
*The client application will run on http://localhost:5173*

## 🧪 Testing
The project includes end-to-end (E2E) tests.
- **Auth Flow & Basic UI**: Verified authentication flows and dashboard interactions.
- **Upload Flow**: Automated tests for logging in, uploading a zip, and verifying project creation on the Kanban board.
