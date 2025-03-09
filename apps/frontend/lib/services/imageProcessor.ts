import axios from 'axios';
import { BookData } from 'shared';
import { createWorker } from 'tesseract.js';

/**
 * Process a book cover image to extract book data
 * @param imageUrl URL of the uploaded image
 * @returns Promise with book data
 */
export async function processBookCover(imageUrl: string): Promise<BookData> {
  try {
    console.log(`Processing image: ${imageUrl}`);
    
    // Call OpenAI API to extract book title and author
    const titleAndAuthor = await extractBookTitleAndAuthor(imageUrl);
    const title = titleAndAuthor.title;
    const author = titleAndAuthor.author;
    
    console.log(`Extracted title: ${title}, author: ${author}`);
    
    // Classify the book as fiction or non-fiction
    const classification = {
      isFiction: true, // Default to fiction
      confidence: 0.8
    };
    
    // Return the book data
    return {
      title,
      author,
      isbn: '',
      coverImageUrl: imageUrl,
      extractedText: `This is a book titled "${title}" by ${author}.`,
      classification
    };
  } catch (error) {
    console.error('Error processing book cover:', error);
    throw error;
  }
}

/**
 * Extract book title and author from an image
 * @param imageUrl URL of the book cover image
 * @returns Promise with title and author
 */
async function extractBookTitleAndAuthor(imageUrl: string): Promise<{ title: string; author: string }> {
  try {
    // For simplicity, we'll use OCR to extract text from the image
    // In a real implementation, you would call the OpenAI API
    
    // Download the image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);
    
    // Initialize Tesseract.js worker for OCR
    const worker = await createWorker();
    
    // Recognize text from the image
    const { data: { text } } = await worker.recognize(imageBuffer);
    
    // Terminate the worker
    await worker.terminate();
    
    // Extract title and author from the text (simplified)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Assume the first line is the title and the second line is the author
    const title = lines[0] || 'Unknown Title';
    const author = lines[1] || 'Unknown Author';
    
    return { title, author };
  } catch (error) {
    console.error('Error extracting book title and author:', error);
    return { title: 'Unknown Title', author: 'Unknown Author' };
  }
} 