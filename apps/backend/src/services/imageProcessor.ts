import { createWorker } from 'tesseract.js';
import { BookData, isValidISBN } from 'shared';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { isBookCover, classifyBook, extractBookText, extractBookTitleAndAuthor } from './openaiService';
import { GoogleBooksService } from './googleBooksService';
import { BookInformationService } from './bookInformationService';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize Google Books Service
const googleBooksService = new GoogleBooksService();

// Initialize Book Information Service
const bookInfoService = new BookInformationService();

/**
 * Process a book cover image to extract book data
 * @param imagePathOrUrl Path to the uploaded image or URL
 * @returns Promise with book data
 */
export async function processBookCover(imagePathOrUrl: string): Promise<BookData> {
  let localImagePath: string | null = null;
  let needsCleanup = false;

  try {
    console.log(`Processing image: ${imagePathOrUrl}`);
    
    // Check if the input is a URL
    if (imagePathOrUrl.startsWith('http')) {
      // Download the image to a temporary file
      console.log('Input is a URL, downloading image...');
      const response = await fetch(imagePathOrUrl);
      const imageBuffer = await response.arrayBuffer();
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Save the image to a temporary file
      localImagePath = path.join(tempDir, `temp-${Date.now()}.jpg`);
      fs.writeFileSync(localImagePath, Buffer.from(imageBuffer));
      needsCleanup = true;
      console.log(`Image downloaded to: ${localImagePath}`);
    } else {
      // Input is a local file path
      localImagePath = imagePathOrUrl;
      
      // Verify the file exists
      if (!fs.existsSync(localImagePath)) {
        console.error(`File does not exist: ${localImagePath}`);
        throw new Error(`File does not exist: ${localImagePath}`);
      }
    }
    
    // Step 1: Validate the image is a book cover using OpenAI GPT-4o mini
    console.log('Step 1: Validating image is a book cover using OpenAI GPT-4o mini');
    const isValidBookCover = await isBookCover(localImagePath);
    if (!isValidBookCover) {
      console.log('Image validation failed: Not a book cover');
      throw new Error('The uploaded image does not appear to be a book cover. Please retake the photo.');
    }
    console.log('Image validation passed: This is a book cover');

    // Step 2: Extract book title and author using OpenAI GPT-4o mini
    console.log('Step 2: Extracting book title and author using OpenAI GPT-4o mini');
    const { title: extractedTitle, author: extractedAuthor } = await extractBookTitleAndAuthor(localImagePath);
    console.log('Extracted title:', extractedTitle);
    console.log('Extracted author:', extractedAuthor);

    // Step 3: Initialize Tesseract.js worker for OCR (for additional text extraction)
    console.log('Step 3: Initializing OCR for additional text extraction');
    const worker = await createWorker();
    
    // Step 4: Recognize text from the image
    console.log('Step 4: Recognizing text from image');
    const { data: { text } } = await worker.recognize(localImagePath);
    console.log('OCR text extracted:', text.substring(0, 100) + '...');
    
    // Step 5: Terminate the worker
    await worker.terminate();
    
    // Step 6: Classify the book as fiction or non-fiction
    console.log('Step 6: Classifying book as fiction or non-fiction');
    const classification = await classifyBook(localImagePath, extractedTitle, extractedAuthor);
    console.log('Book classification:', classification);
    
    // Step 7: Finalize the title and author
    const finalTitle = extractedTitle;
    const finalAuthor = extractedAuthor;
    
    // Step 8: Try to find book preview text
    console.log('Step 8: Finding book preview text');
    let pdfText = null;
    
    try {
      // Make multiple attempts to find book information with different search variations
      console.log('Attempting to find book information with multiple search variations...');
      pdfText = await bookInfoService.findBookInformation(finalTitle, finalAuthor);
      
      // Check if the result is a special JSON response with both text and HTML
      if (pdfText && pdfText.startsWith('{') && pdfText.endsWith('}')) {
        try {
          const jsonData = JSON.parse(pdfText);
          if (jsonData.text && jsonData.html) {
            pdfText = jsonData.text;
            // Store the HTML for embedded viewer
            const embeddedViewerHtml = jsonData.html;
            
            // Return the book data with embedded viewer HTML
            return {
              title: finalTitle,
              author: finalAuthor,
              extractedText: pdfText,
              coverImageUrl: imagePathOrUrl, // Use the original URL
              classification,
              embeddedViewerHtml,
              isbn: '' // Add empty ISBN as it's required by the BookData type
            };
          }
        } catch (e) {
          // Not valid JSON, continue with normal text
          console.log('Preview text is not valid JSON, using as plain text');
        }
      }
    } catch (error) {
      console.error('Error finding book preview:', error);
    }
    
    // Step 9: If no preview text was found, use OpenAI to generate some text
    if (!pdfText) {
      console.log('No preview text found, generating with OpenAI...');
      pdfText = await extractBookText(finalTitle, finalAuthor, classification.isFiction);
    }
    
    // Step 10: Return the book data
    return {
      title: finalTitle,
      author: finalAuthor,
      extractedText: pdfText,
      coverImageUrl: imagePathOrUrl, // Use the original URL
      classification,
      isbn: '' // Add empty ISBN as it's required by the BookData type
    };
  } catch (error) {
    console.error('Error processing book cover:', error);
    throw error;
  } finally {
    // Clean up temporary file if needed
    if (needsCleanup && localImagePath && fs.existsSync(localImagePath)) {
      try {
        fs.unlinkSync(localImagePath);
        console.log(`Cleaned up temporary file: ${localImagePath}`);
      } catch (error) {
        console.error('Error cleaning up temporary file:', error);
      }
    }
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
    const worker = await createWorker();
    const result = await worker.recognize(imagePath);
    await worker.terminate();
    
    // If the image contains a significant amount of text, it's likely a book cover
    const textLength = result.data.text.trim().length;
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
 * @param title Book title from OpenAI
 * @param author Book author from OpenAI
 * @returns Book data object with basic information
 */
function extractBookData(text: string, title: string, author: string): BookData {
  // Look for ISBN pattern
  const isbnMatch = text.match(/(?:ISBN(?:-1[03])?:?\s*)?(?=[0-9X]{10}|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[- ]){4})[- 0-9]{17})/i);
  const isbn = isbnMatch ? isbnMatch[0].replace(/[^0-9X]/gi, '') : '0000000000000';
  
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