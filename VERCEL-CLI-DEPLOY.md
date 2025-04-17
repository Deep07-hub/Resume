# Deploying with Vercel CLI

Follow these steps to deploy your application using the Vercel CLI:

## Prerequisites

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Make sure you have a PostgreSQL database ready (Vercel Postgres, Supabase, Neon, etc.)

3. OpenAI API key for resume parsing functionality

## Deployment Steps

1. Log in to Vercel (if not already logged in):
   ```
   vercel login
   ```

2. Run the deployment command:
   ```
   vercel --prod
   ```

3. During the CLI setup, when prompted:
   - Set up and deploy: Yes
   - Link to existing project: Choose your project or No to create a new one
   - Directory: ./ (root directory)
   - Override settings: Yes
   - Build Command: npm run build 
   - Development Command: npm run dev
   - Output Directory: .next

4. Set environment variables when prompted or add them later through the Vercel dashboard:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   OPENAI_API_KEY=your_openai_api_key
   LLM_PROVIDER=openai
   LLM_MODEL=gpt-4o
   ENABLE_LLM=true
   ```

## Troubleshooting

If you encounter installation errors with `pnpm`, use these flags:
```
vercel --prod --force --skip-build
```

Then go to your project settings in the Vercel dashboard, update the installation command to:
```
npm install --no-frozen-lockfile
```

And manually trigger a new deployment from the dashboard.

## Subsequent Deployments

For future deployments, simply run:
```
vercel --prod
``` 