import { createWorker } from 'tesseract.js';
import { BookData, isValidISBN } from 'shared';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Process a book cover image to extract book data
 * @param imagePath Path to the uploaded image
 * @returns Promise with book data
 */
export async function processBookCover(imagePath: string): Promise<BookData> {
  try {
    console.log(`Processing image: ${imagePath}`);
    
    // Verify the file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`File does not exist: ${imagePath}`);
      throw new Error(`File does not exist: ${imagePath}`);
    }
    
    // Step 1: Validate the image is a book cover
    console.log('Step 1: Validating image is a book cover');
    const isBookCover = await validateImageIsBook(imagePath);
    if (!isBookCover) {
      console.log('Image validation failed: Not a book cover');
      throw new Error('The uploaded image does not appear to be a book cover');
    }
    console.log('Image validation passed');

    // Step 2: Initialize Tesseract.js worker for OCR
    console.log('Step 2: Initializing OCR');
    const worker = await createWorker('eng');
    
    // Step 3: Recognize text from the image
    console.log('Step 3: Recognizing text from image');
    const { data } = await worker.recognize(imagePath);
    await worker.terminate();
    console.log('Recognized text:', data.text.substring(0, 100) + '...');
    
    // Step 4: Extract basic book data from the recognized text
    console.log('Step 4: Extracting book data from text');
    const extractedData = extractBookData(data.text);
    console.log('Extracted data:', extractedData);
    
    // Step 5: Identify the book using Open Library API
    console.log('Step 5: Identifying book using Open Library API');
    const bookInfo = await identifyBookByTitle(extractedData.title, extractedData.author);
    console.log('Book info from API:', bookInfo);
    
    // Step 6: Fetch book excerpt if available
    console.log('Step 6: Fetching book excerpt');
    let description = '';
    if (bookInfo && bookInfo.openLibraryID) {
      description = await fetchBookExcerpt(bookInfo.openLibraryID);
      console.log('Fetched description:', description.substring(0, 100) + '...');
    } else {
      console.log('No Open Library ID available, skipping excerpt fetch');
    }
    
    // Step 7: Combine all data
    console.log('Step 7: Combining all data');
    const bookData: BookData = {
      title: bookInfo?.title || extractedData.title,
      author: bookInfo?.author || extractedData.author,
      isbn: bookInfo?.isbn || extractedData.isbn,
      publisher: bookInfo?.publisher,
      publicationYear: bookInfo?.publicationYear,
      description: description || 'No description available',
      coverImageUrl: bookInfo?.coverImageUrl
    };
    
    console.log('Final book data:', bookData);
    
    return bookData;
  } catch (error) {
    console.error('Error processing book cover:', error);
    throw new Error('Failed to process book cover image');
  }
}

/**
 * Validate if the image is likely a book cover
 * This is a simplified implementation that assumes any image with text is a book cover
 * In a production environment, you would use a more sophisticated image classification model
 * @param imagePath Path to the image
 * @returns Promise<boolean> True if the image is likely a book cover
 */
async function validateImageIsBook(imagePath: string): Promise<boolean> {
  try {
    // Simple validation: Check if the image contains text using OCR
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(imagePath);
    await worker.terminate();
    
    // If the image contains a significant amount of text, it's likely a book cover
    const textLength = data.text.trim().length;
    return textLength > 20; // Arbitrary threshold
    
    // Note: In a production environment, you would use:
    // 1. A pre-trained image classification model (TensorFlow.js, etc.)
    // 2. A cloud service like Google Vision API or AWS Rekognition
    // 3. A multimodal model like CLIP to check similarity to "book cover"
  } catch (error) {
    console.error('Error validating image:', error);
    return false;
  }
}

/**
 * Extract book data from recognized text
 * @param text Text recognized from the image
 * @returns Book data object with basic information
 */
function extractBookData(text: string): BookData {
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

/**
 * Interface for book information returned from Open Library
 */
interface OpenLibraryBookInfo {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  openLibraryID?: string;
  coverImageUrl?: string;
}

/**
 * Identify a book by title and author using Open Library API
 * @param title Book title
 * @param author Book author
 * @returns Promise with book information or null if not found
 */
async function identifyBookByTitle(title: string, author: string): Promise<OpenLibraryBookInfo | null> {
  try {
    // Construct search query
    const query = `title=${encodeURIComponent(title)}${author ? `+author=${encodeURIComponent(author)}` : ''}`;
    const url = `https://openlibrary.org/search.json?${query}`;
    
    // Fetch results from Open Library
    const response = await fetch(url);
    const data = await response.json() as any;
    
    // Check if we have results
    if (!data.docs || data.docs.length === 0) {
      console.log('No books found for query:', query);
      return null;
    }
    
    // Get the first (most relevant) result
    const book = data.docs[0];
    
    // Extract cover image URL if available
    let coverImageUrl: string | undefined;
    if (book.cover_i) {
      coverImageUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
    }
    
    // Extract publication year
    const publicationYear = book.first_publish_year || (book.publish_date ? parseInt(book.publish_date[0].slice(-4)) : undefined);
    
    // Return formatted book info
    return {
      title: book.title,
      author: book.author_name ? book.author_name[0] : 'Unknown',
      isbn: book.isbn ? book.isbn[0] : undefined,
      publisher: book.publisher ? book.publisher[0] : undefined,
      publicationYear: publicationYear,
      openLibraryID: book.key,
      coverImageUrl
    };
  } catch (error) {
    console.error('Error identifying book:', error);
    return null;
  }
}

/**
 * Fetch book excerpt or description from Open Library
 * @param openLibraryID Open Library work ID
 * @returns Promise with book excerpt or empty string if not available
 */
async function fetchBookExcerpt(openLibraryID: string): Promise<string> {
  try {
    // Fetch work data from Open Library
    const url = `https://openlibrary.org${openLibraryID}.json`;
    const response = await fetch(url);
    const workData = await response.json() as any;
    
    // Try to get first sentence
    if (workData.first_sentence) {
      return typeof workData.first_sentence === 'string' 
        ? workData.first_sentence 
        : workData.first_sentence.value || '';
    }
    
    // Fall back to description
    if (workData.description) {
      const description = typeof workData.description === 'string' 
        ? workData.description 
        : workData.description.value || '';
      
      // Return first 500 characters if description is long
      return description.length > 500 
        ? description.substring(0, 500) + '...' 
        : description;
    }
    
    return 'No preview text available';
  } catch (error) {
    console.error('Error fetching book excerpt:', error);
    return 'Error retrieving book excerpt';
  }
} 