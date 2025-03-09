import { Request, Response } from 'express';
import { PdfScraperService } from '../services/pdfScraperService';
import * as OpenAIService from '../services/openaiService';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Initialize PDF scraper service
const pdfScraperService = new PdfScraperService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

// File filter to only allow image files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

/**
 * Get book preview by title and author
 * @param req Request with title and author in query params
 * @param res Response
 */
export async function getBookPreview(req: Request, res: Response) {
  try {
    const { title, author } = req.query;
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Book title is required' 
      });
    }
    
    const previewText = await pdfScraperService.findBookPdf(
      title as string,
      author as string | undefined
    );
    
    if (!previewText) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book preview not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      previewText 
    });
  } catch (error) {
    console.error('Error getting book preview:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error getting book preview' 
    });
  }
}

/**
 * Process book cover image upload
 * @param req Request with file upload
 * @param res Response
 */
export async function processBookCover(req: Request, res: Response) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file uploaded' 
      });
    }
    
    const imagePath = req.file.path;
    const currentRetry = parseInt(req.body.currentRetry || '0', 10);
    const maxRetries = 3; // Maximum number of retry attempts
    
    console.log(`Processing book cover image (Attempt ${currentRetry + 1}/${maxRetries + 1})`);
    
    // Process the book cover image with retry handling
    const result = await OpenAIService.handleBookCoverRetryFlow(
      imagePath,
      pdfScraperService,
      currentRetry,
      maxRetries
    );
    
    // If the image is not a valid book cover and needs retry
    if (!result.isValid && result.needsRetry) {
      // Clean up the invalid image file
      try {
        fs.unlinkSync(imagePath);
      } catch (err) {
        console.error('Error deleting invalid image file:', err);
      }
      
      return res.status(400).json({
        success: false,
        isValid: false,
        needsRetry: true,
        retriesLeft: result.retriesLeft,
        currentAttempt: result.currentAttempt,
        message: result.message
      });
    }
    
    // If the image is valid but we couldn't extract preview text
    if (result.isValid && !result.previewText) {
      return res.json({
        success: true,
        isValid: true,
        needsRetry: false,
        message: result.message,
        bookInfo: result.bookInfo
      });
    }
    
    // Success case - valid book cover with preview text
    return res.json({
      success: true,
      isValid: true,
      needsRetry: false,
      message: result.message,
      bookInfo: result.bookInfo,
      previewText: result.previewText
    });
  } catch (error) {
    console.error('Error processing book cover:', error);
    
    // Clean up the image file in case of error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting image file after error:', err);
      }
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing book cover image' 
    });
  }
}

/**
 * Get book by ISBN
 * @param req Request with ISBN in query params
 * @param res Response
 */
export async function getBookByIsbn(req: Request, res: Response) {
  try {
    const { isbn } = req.query;
    
    if (!isbn) {
      return res.status(400).json({ 
        success: false, 
        message: 'ISBN is required' 
      });
    }
    
    const previewText = await pdfScraperService.findBookByIsbn(isbn as string);
    
    if (!previewText) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book with this ISBN not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      previewText 
    });
  } catch (error) {
    console.error('Error getting book by ISBN:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error getting book by ISBN' 
    });
  }
} 