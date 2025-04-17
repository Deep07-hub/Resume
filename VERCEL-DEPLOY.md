# Deploying to Vercel

This guide explains how to deploy this application to Vercel.

## Prerequisites

1. A Vercel account: [Sign up here](https://vercel.com/signup) if you don't have one.
2. A PostgreSQL database (you can use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or any other Postgres provider).
3. OpenAI API key for the resume parsing functionality.

## Deployment Steps

### 1. Fork/Clone the Repository

Make sure you have the latest version of the code in your GitHub account.

### 2. Connect to Vercel

1. Log in to your Vercel account
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install --no-frozen-lockfile`

### 3. Environment Variables

Add the following environment variables in the Vercel dashboard:

```
DATABASE_URL=postgresql://username:password@host:port/database
OPENAI_API_KEY=your_openai_api_key
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
ENABLE_LLM=true
```

### 4. Deploy

Click "Deploy" and wait for the build process to complete.

### 5. Database Schema

After deployment, you need to apply the database schema:

1. Go to the "Deployments" tab in your Vercel project
2. Select the latest deployment
3. Click "Redeploy" and choose "Redeploy with existing build cache"

This will run the Prisma migrations during the build process.

## Troubleshooting

- **Installation Errors**: If you see "Error: Command 'pnpm install' exited with 1", make sure you've specified `npm install --no-frozen-lockfile` as the install command in your Vercel project settings.
- **Database Connection Issues**: Make sure your DATABASE_URL is correct and your database is accessible from Vercel's servers.
- **Build Errors**: Check the build logs for specific error messages.
- **API Errors**: Verify that all required environment variables are set correctly.

## Updating Your Deployment

When you push changes to your GitHub repository, Vercel will automatically redeploy your application. 