# Fixed Vercel Deployment Guide

This guide provides updated instructions for deploying your Book Extraction app to Vercel, addressing the "Cannot find module 'shared'" error.

## The Problem

The error occurs because the frontend code imports types from a 'shared' package, but Vercel's build process can't find this package.

## The Solution

We've created a mock 'shared' package in the node_modules directory that provides the necessary types and functions. This allows the build process to find the 'shared' package without having to modify all the import statements in the codebase.

## Changes Made

1. Created a mock 'shared' package in the node_modules directory:
   - `node_modules/shared/index.js` - JavaScript implementation
   - `node_modules/shared/index.d.ts` - TypeScript type definitions
   - `node_modules/shared/package.json` - Package configuration

2. The mock package provides:
   - `BookData` interface
   - `BookClassification` interface
   - `ImageUploadResponse` interface
   - `isValidISBN` function

## Deployment Steps

### 1. Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository, including the mock 'shared' package.

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

If you still encounter issues with the 'shared' package:

1. **Check the node_modules directory**: Make sure the mock 'shared' package is included in your repository.

2. **Check the build logs**: Look for any errors related to the 'shared' package.

3. **Try a different approach**: If the mock package doesn't work, you can try:
   - Creating a real 'shared' package in your monorepo
   - Updating all import statements to use local types instead of the 'shared' package
   - Using Next.js's transpilePackages option to include the 'shared' package

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