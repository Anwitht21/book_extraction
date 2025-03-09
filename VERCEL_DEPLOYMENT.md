# Deploying to Vercel

This guide will help you deploy your Book Extraction app to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Required API keys:
   - OpenAI API Key
   - Google Books API Key
   - Vercel Blob Storage Token

## Deployment Steps

### 1. Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository.

### 2. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your Git repository
4. Select the repository containing your Book Extraction app

### 3. Configure Project Settings

1. **Framework Preset**: Select "Next.js"
2. **Root Directory**: Leave as is (the project root)
3. **Build Command**: `npm run build`
4. **Output Directory**: `apps/frontend/.next`
5. **Install Command**: `npm install`

### 4. Environment Variables

Add the following environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `GOOGLE_BOOKS_API_KEY`: Your Google Books API key
- `BLOB_READ_WRITE_TOKEN`: Your Vercel Blob Storage token

To get a Blob Storage token:
1. Go to Vercel Dashboard > Storage > Blob
2. Create a new Blob store
3. Generate a new token with read/write permissions

### 5. Deploy

Click "Deploy" and wait for the deployment to complete.

## Troubleshooting

### File Upload Issues

If you encounter issues with file uploads:
- Make sure your `BLOB_READ_WRITE_TOKEN` is correctly set
- Check that the Vercel Blob Storage is properly configured
- Verify that the file size is within limits (max 10MB)

### API Connection Issues

If the frontend can't connect to the API:
- Check that the API routes are correctly set up in `vercel.json`
- Verify that the serverless functions are properly deployed
- Check the Vercel logs for any errors

### Environment Variable Issues

If the app can't access environment variables:
- Make sure they're correctly set in the Vercel dashboard
- Verify that they're being accessed correctly in the code
- Restart the deployment if needed

## Local Development

For local development:

1. Create a `.env.local` file in the `apps/frontend` directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_BOOKS_API_KEY=your_google_books_api_key
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. 