import express from 'express';
import cors from 'cors';
import { uploadRoutes } from './routes/upload';
import { bookRoutes } from './routes/book';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env file:', envPath);
  require('dotenv').config({ path: envPath });
} else {
  console.warn('No .env file found. Make sure to set OPENAI_API_KEY and GOOGLE_BOOKS_API_KEY environment variables.');
}

// Check for required API keys
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. Some features may not work properly.');
}

if (!process.env.GOOGLE_BOOKS_API_KEY) {
  console.warn('GOOGLE_BOOKS_API_KEY is not set. Book content retrieval may be limited.');
}

// Ensure temp directory exists for PDF downloads
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  console.log('Creating temp directory for PDF downloads:', tempDir);
  fs.mkdirSync(tempDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/book', bookRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.status(200).json({ message: 'Backend is working!' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 