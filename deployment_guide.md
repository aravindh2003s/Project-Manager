# GrowTech PMS Deployment Guide

This document outlines the steps required to deploy the complete Project Manager application to production. Since the application consists of a decoupled frontend (Vite/React) and backend (Express/Socket.IO/Prisma), you will deploy them separately.

## 1. Backend Deployment (Node.js API + WebSockets)

The backend requires a Node.js environment. We recommend deploying to Platforms as a Service (PaaS) like **Render**, **Railway**, or **Heroku**, which easily support WebSockets.

### Prerequisites & Database Setup
By default, the project uses **SQLite**. In a serverless or ephemeral container environment (like Heroku or Render Free Tier), SQLite databases will be wiped every time the server restarts. 
> [!IMPORTANT]
> For production, it's highly recommended to switch to **PostgreSQL**.
> 1. In `server/prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
> 2. Provision a PostgreSQL database (e.g., Supabase, Render Postgres, AWS RDS).
> 3. Update the `DATABASE_URL` environment variable.

### Environment Variables
You must configure the following environment variables in your deployment platform:
- `PORT`: (Usually provided automatically by the host, e.g., `8080`)
- `NODE_ENV`: `production`
- `JWT_SECRET`: A strong, randomly generated string for signing authentication tokens.
- `DATABASE_URL`: Your database connection string.
- `CORS_ORIGIN`: The deployed URL of your frontend (e.g., `https://my-pms-client.vercel.app`).

### Build and Start Commands
In your deployment dashboard, configure the following:
- **Root Directory:** `server`
- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Start Command:** `npx prisma migrate deploy && npm start` 
*(This ensures your database schema is up-to-date before starting the server).*

---

## 2. Frontend Deployment (React / Vite)

The frontend is a static Single Page Application (SPA) and can be hosted quickly and for free on platforms like **Vercel**, **Netlify**, or **Cloudflare Pages**.

### Environment Variables
You must provide the URL of your newly deployed backend so the React app knows where to send API requests and WebSocket connections.
- `VITE_API_URL`: The URL of your deployed backend (e.g., `https://my-pms-api.onrender.com`).

### Build Settings (Vercel / Netlify)
Most modern platforms will auto-detect Vite. If not, use these settings:
- **Root Directory:** `client`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Client-Side Routing configuration
Since it is an SPA (React Router), ensure your host rewrites all requests to `index.html`. 
- **Vercel:** Works automatically when Vite is selected.
- **Netlify:** Create a `public/_redirects` file in the `client` folder containing: `/* /index.html 200`

---

## 3. Post-Deployment Checklist

1. **Verify CORS:** Check your browser's console network tab when logging in. If you see a CORS error, verify that the `CORS_ORIGIN` variable in the backend exactly matches the frontend URL (no trailing slashes).
2. **Verify WebSockets:** Open a project and check the "Network" tab (filter by `WS`) to ensure the Socket.IO connection upgrades successfully.
3. **First User Registration:** Go to your deployed frontend, register an account, and ensure it correctly redirects you to the dashboard without network timeouts.
