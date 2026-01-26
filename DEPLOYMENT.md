# Railway Deployment Guide

This guide explains how to deploy the CoastCap Liquidity App to Railway.

## Prerequisites

- A [Railway](https://railway.app) account
- Git repository with your code (GitHub, GitLab, or Bitbucket)
- Railway CLI (optional, for local deployment)

## Deployment Steps

### Step 1: Push Code to Git Repository

Make sure your code is pushed to a Git repository:

```bash
git init
git add .
git commit -m "Prepare for Railway deployment"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Create New Project on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account (if not already done)
5. Select your repository

### Step 3: Add Persistent Volume for Database

**Important:** SQLite requires a persistent volume to retain data between deployments.

1. In your Railway project, click on your service
2. Go to the **"Volumes"** tab
3. Click **"+ New Volume"**
4. Configure the volume:
   - **Name:** `data`
   - **Mount Path:** `/data`
5. Click **"Create Volume"**

### Step 4: Configure Environment Variables

1. In your Railway service, go to the **"Variables"** tab
2. Add the following variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enables production mode |
| `RAILWAY_VOLUME_MOUNT_PATH` | `/data` | Database storage path |
| `AUTH_USERNAME` | `your-username` | Login username |
| `AUTH_PASSWORD` | `your-secure-password` | Login password |
| `SESSION_SECRET` | `random-32-char-string` | Session encryption key |

> **Security Notes:**
> - `PORT` is automatically set by Railway - do not set it manually
> - Use a strong, unique password for `AUTH_PASSWORD`
> - Generate a random string for `SESSION_SECRET` (e.g., run `openssl rand -hex 32`)

### Step 5: Deploy

Railway will automatically detect the `railway.toml` configuration and:
1. Install dependencies with `npm install`
2. Build the frontend with `npm run build`
3. Start the server with `npm start`

### Step 6: Access Your App

1. Go to the **"Settings"** tab in your service
2. Under **"Networking"**, click **"Generate Domain"**
3. Your app will be available at the generated URL (e.g., `your-app.up.railway.app`)

## Configuration Files

### railway.toml

The `railway.toml` file configures Railway's build and deploy process:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

## Architecture in Production

```
[Railway]
    |
    +-- Service (Node.js)
    |       |
    |       +-- Express Server (serves API + static files)
    |       |       - /api/* routes -> API endpoints
    |       |       - /* routes -> React SPA (dist/index.html)
    |       |
    |       +-- Volume (/data)
    |               - liquidity.db (SQLite database)
```

## Local Development

To run locally:

```bash
# Install dependencies
npm install

# Run both frontend and backend in development mode
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173 (with hot reload)
- Backend API: http://localhost:3001

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes (production) | `development` | Set to `production` for Railway |
| `PORT` | No | `3001` | Server port (auto-set by Railway) |
| `RAILWAY_VOLUME_MOUNT_PATH` | Yes (Railway) | - | Path to persistent volume for database |
| `AUTH_USERNAME` | Yes | `admin` | Login username for app access |
| `AUTH_PASSWORD` | Yes | `changeme` | Login password for app access |
| `SESSION_SECRET` | Recommended | auto-generated | Secret key for session encryption |

## Troubleshooting

### Database is reset after deployment

Make sure you have:
1. Created a volume in Railway
2. Set `RAILWAY_VOLUME_MOUNT_PATH` environment variable to match the volume mount path

### App not loading

1. Check the deployment logs in Railway dashboard
2. Verify the health check endpoint works: `curl https://your-app.up.railway.app/api/health`

### API errors

1. Open browser developer tools (F12)
2. Check the Network tab for failed requests
3. Review Railway logs for server-side errors

## Monitoring

- **Logs:** Available in Railway dashboard under your service
- **Metrics:** CPU, memory, and network usage visible in Railway dashboard
- **Health Check:** Endpoint at `/api/health` returns server status

## Updating the App

Simply push changes to your Git repository:

```bash
git add .
git commit -m "Your changes"
git push
```

Railway will automatically rebuild and redeploy your app.
