import express, { Request, Response } from 'express';
import multer from 'multer';
import { processBookCover } from '../services/imageProcessor';
import { ImageUploadResponse } from 'shared';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage instead of disk storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer: Filtering file', file.mimetype);
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('Multer: Rejected non-image file');
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Handle book cover image upload
router.post('/', upload.single('coverImage'), async (req: Request, res: Response) => {
  console.log('Upload route: Received request');
  try {
    if (!req.file) {
      console.log('Upload route: No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        error: 'Please upload a book cover image'
      } as ImageUploadResponse);
    }

    console.log('Upload route: File received in memory', req.file.originalname);
    
    // Save the file to disk temporarily
    const filePath = path.join(uploadsDir, Date.now() + '-' + req.file.originalname);
    fs.writeFileSync(filePath, req.file.buffer);
    console.log('Upload route: Saved file to disk at', filePath);
    
    // Process the uploaded image
    console.log('Upload route: Processing image');
    const result = await processBookCover(filePath);
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    console.log('Upload route: Cleaned up temporary file');
    
    console.log('Upload route: Processing complete, sending response');
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