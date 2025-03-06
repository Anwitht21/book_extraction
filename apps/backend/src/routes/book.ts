import express, { Request, Response } from 'express';
import { BookData } from 'shared';

const router = express.Router();

// Mock database for demonstration purposes
const bookDatabase: Record<string, BookData> = {
  '9781234567897': {
    title: 'The Great Novel',
    author: 'Jane Doe',
    isbn: '9781234567897',
    publisher: 'Example Press',
    publicationYear: 2022,
    description: 'A fascinating story about technology and humanity.'
  },
  '9789876543210': {
    title: 'Programming Concepts',
    author: 'John Smith',
    isbn: '9789876543210',
    publisher: 'Tech Books Inc.',
    publicationYear: 2021,
    description: 'A comprehensive guide to modern programming paradigms.'
  }
};

// Get book data by ISBN
router.get('/:isbn', (req: Request, res: Response) => {
  const { isbn } = req.params;
  
  if (!isbn) {
    return res.status(400).json({
      success: false,
      message: 'ISBN is required',
      error: 'Please provide a valid ISBN'
    });
  }
  
  const bookData = bookDatabase[isbn];
  
  if (!bookData) {
    return res.status(404).json({
      success: false,
      message: 'Book not found',
      error: `No book found with ISBN: ${isbn}`
    });
  }
  
  return res.status(200).json({
    success: true,
    message: 'Book data retrieved successfully',
    bookData
  });
});

export const bookRoutes = router; 