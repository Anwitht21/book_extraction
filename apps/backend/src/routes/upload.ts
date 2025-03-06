import express, { Request, Response } from 'express';
import multer from 'multer';
import { processBookCover } from '../services/imageProcessor';
import { ImageUploadResponse } from 'shared';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Handle book cover image upload
router.post('/', upload.single('coverImage'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        error: 'Please upload a book cover image'
      } as ImageUploadResponse);
    }

    // Process the uploaded image
    const result = await processBookCover(req.file.path);
    
    return res.status(200).json({
      success: true,
      message: 'Image processed successfully',
      bookData: result
    } as ImageUploadResponse);
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process image',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ImageUploadResponse);
  }
});

export const uploadRoutes = router; 