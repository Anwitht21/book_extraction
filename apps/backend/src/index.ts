import express from 'express';
import cors from 'cors';
import { uploadRoutes } from './routes/upload';
import { bookRoutes } from './routes/book';

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