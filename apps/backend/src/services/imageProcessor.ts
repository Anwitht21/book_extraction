import { createWorker } from 'tesseract.js';
import { BookData, isValidISBN } from 'shared';
import fs from 'fs';
import path from 'path';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Process a book cover image to extract book data
 * @param imagePath Path to the uploaded image
 * @returns Promise with book data
 */
export async function processBookCover(imagePath: string): Promise<BookData> {
  try {
    // Initialize Tesseract.js worker
    const worker = await createWorker('eng');
    
    // Recognize text from the image
    const { data } = await worker.recognize(imagePath);
    await worker.terminate();
    
    // Extract book data from the recognized text
    const bookData = extractBookData(data.text);
    
    // Clean up the uploaded file after processing
    // fs.unlinkSync(imagePath); // Uncomment to delete file after processing
    
    return bookData;
  } catch (error) {
    console.error('Error processing book cover:', error);
    throw new Error('Failed to process book cover image');
  }
}

/**
 * Extract book data from recognized text
 * @param text Text recognized from the image
 * @returns Book data object
 */
function extractBookData(text: string): BookData {
  // This is a simplified example. In a real application, you would use
  // more sophisticated NLP techniques to extract structured data.
  
  // Look for ISBN pattern
  const isbnMatch = text.match(/(?:ISBN(?:-1[03])?:?\s*)?(?=[0-9X]{10}|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[- ]){4})[- 0-9]{17})/i);
  const isbn = isbnMatch ? isbnMatch[0].replace(/[^0-9X]/gi, '') : '0000000000000';
  
  // Extract title (simplified approach)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const title = lines.length > 0 ? lines[0] : 'Unknown Title';
  
  // Extract author (simplified approach)
  const authorLine = lines.find(line => line.toLowerCase().includes('by '));
  const author = authorLine ? authorLine.replace(/by /i, '').trim() : 'Unknown Author';
  
  return {
    title,
    author,
    isbn: isValidISBN(isbn) ? isbn : '0000000000000'
  };
} 