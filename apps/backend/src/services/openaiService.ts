import OpenAI from 'openai';
import fs from 'fs';
import { BookClassification } from 'shared';
import path from 'path';
import dotenv from 'dotenv';
import { PdfScraperService } from './pdfScraperService';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env file:', envPath);
  dotenv.config({ path: envPath });
}

// Get API key from environment variables or use a default for development
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ OPENAI_API_KEY is not set in environment variables or .env file');
  console.warn('⚠️ OpenAI functionality will not work without a valid API key');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
});

/**
 * Validates if an image is a book cover using OpenAI's GPT-4o mini model
 * @param imagePath Path to the image file
 * @returns Promise<boolean> True if the image is a book cover
 */
export async function isBookCover(imagePath: string): Promise<boolean> {
  try {
    if (!apiKey) {
      console.warn('OpenAI API key not set, skipping book cover validation');
      return true; // Assume it's a book cover if API key is not set
    }

    console.log('Validating if image is a book cover using OpenAI GPT-4o mini');
    
    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Call OpenAI API with GPT-4o mini
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Is this image a book cover? Please respond with only 'yes' or 'no'." 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 10,
    });
    
    const result = response.choices[0]?.message?.content?.toLowerCase() || '';
    console.log('OpenAI book cover validation result:', result);
    
    return result.includes('yes');
  } catch (error) {
    console.error('Error validating book cover with OpenAI:', error);
    // Fall back to assuming it's a book cover in case of API errors
    return true;
  }
}

/**
 * Classifies a book as fiction or non-fiction using OpenAI GPT-4o mini
 * @param imagePath Path to the book cover image
 * @param bookTitle Book title (if available)
 * @param bookAuthor Book author (if available)
 * @returns Promise<BookClassification> Classification result
 */
export async function classifyBook(
  imagePath: string, 
  bookTitle?: string, 
  bookAuthor?: string
): Promise<BookClassification> {
  try {
    if (!apiKey) {
      console.warn('OpenAI API key not set, defaulting to fiction classification');
      return {
        isFiction: true,
        confidence: 0.5,
      };
    }

    console.log('Classifying book as fiction or non-fiction using OpenAI GPT-4o mini');
    
    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Prepare prompt with available information
    let prompt = "Is this book fiction or non-fiction? ";
    if (bookTitle) {
      prompt += `The title is "${bookTitle}". `;
    }
    if (bookAuthor) {
      prompt += `The author is "${bookAuthor}". `;
    }
    prompt += "Please respond with only 'fiction' or 'non-fiction'.";
    
    // Call OpenAI API with GPT-4o mini
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 10,
    });
    
    const result = response.choices[0]?.message?.content?.toLowerCase() || '';
    console.log('OpenAI book classification result:', result);
    
    return {
      isFiction: result.includes('fiction') && !result.includes('non-fiction'),
      confidence: 0.85, // Slightly lower confidence with mini model
    };
  } catch (error) {
    console.error('Error classifying book with OpenAI:', error);
    // Default to fiction in case of API errors
    return {
      isFiction: true,
      confidence: 0.5,
    };
  }
}

/**
 * Extracts text from the first pages of a book using OpenAI GPT-4o mini
 * @param bookTitle Book title
 * @param bookAuthor Book author
 * @param isFiction Whether the book is fiction or non-fiction
 * @returns Promise<string> Extracted text from the first pages
 */
export async function extractBookText(
  bookTitle: string,
  bookAuthor: string,
  isFiction: boolean
): Promise<string> {
  try {
    if (!apiKey) {
      console.warn('OpenAI API key not set, returning placeholder text');
      return `This is placeholder text for "${bookTitle}" by ${bookAuthor}. Please set your OpenAI API key to get real text extraction.`;
    }

    console.log('Extracting book text using OpenAI GPT-4o mini');
    
    // Determine which page to extract based on book type
    const pageToExtract = isFiction ? 'second' : 'first';
    
    // Create prompt for OpenAI
    const prompt = `
      I need the text from the ${pageToExtract} page of the book "${bookTitle}" by ${bookAuthor}.
      Please provide the actual text content from this page, excluding any title pages, copyright information, 
      table of contents, or other front matter. I'm looking for the first page of actual content.
      
      If you don't have access to this specific book, please generate a plausible first page 
      that matches the book's title, author, and genre (${isFiction ? 'fiction' : 'non-fiction'}).
      Make it sound authentic and match the expected style of this author and genre.
      
      Return only the text content without any explanations or disclaimers.
    `;
    
    // Call OpenAI API with GPT-4o mini
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant with access to a vast library of books." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
    });
    
    const extractedText = response.choices[0]?.message?.content || '';
    console.log('OpenAI book text extraction result:', extractedText.substring(0, 100) + '...');
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting book text with OpenAI:', error);
    return 'Unable to extract text from this book.';
  }
}

/**
 * Extracts book title and author from a book cover image using OpenAI GPT-4o mini
 * @param imagePath Path to the book cover image
 * @returns Promise with book title and author
 */
export async function extractBookTitleAndAuthor(imagePath: string): Promise<{ title: string; author: string }> {
  try {
    if (!apiKey) {
      console.warn('OpenAI API key not set, returning placeholder title and author');
      return { 
        title: 'Unknown Title', 
        author: 'Unknown Author' 
      };
    }

    console.log('Extracting book title and author using OpenAI GPT-4o mini');
    
    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Call OpenAI API with GPT-4o mini
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts book titles and authors from book cover images. Respond in JSON format with title and author fields."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "What is the title and author of this book? Please respond in JSON format with 'title' and 'author' fields only. If you can't determine the author, use 'Unknown' as the value." 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 150,
    });
    
    const result = response.choices[0]?.message?.content || '{"title": "Unknown Title", "author": "Unknown Author"}';
    console.log('OpenAI book title and author extraction result:', result);
    
    try {
      const parsedResult = JSON.parse(result);
      return {
        title: parsedResult.title || 'Unknown Title',
        author: parsedResult.author || 'Unknown Author'
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return { 
        title: 'Unknown Title', 
        author: 'Unknown Author' 
      };
    }
  } catch (error) {
    console.error('Error extracting book title and author with OpenAI:', error);
    return { 
      title: 'Unknown Title', 
      author: 'Unknown Author' 
    };
  }
}

/**
 * Validates if an image is a book cover with retry functionality
 * @param imagePath Path to the image file
 * @param maxRetries Maximum number of retries allowed (default: 3)
 * @returns Promise with validation result, retry information, and message
 */
export async function validateBookCoverWithRetry(
  imagePath: string, 
  maxRetries: number = 3
): Promise<{
  isValid: boolean;
  needsRetry: boolean;
  retriesLeft: number;
  message: string;
}> {
  try {
    console.log(`Validating book cover image with ${maxRetries} retries remaining`);
    
    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      return {
        isValid: false,
        needsRetry: maxRetries > 0,
        retriesLeft: maxRetries,
        message: `Image file not found. ${maxRetries > 0 ? `Please upload a valid image (${maxRetries} attempts remaining).` : 'No more attempts remaining.'}`
      };
    }
    
    // Validate if the image is a book cover using OpenAI
    const isValid = await isBookCover(imagePath);
    
    if (isValid) {
      return {
        isValid: true,
        needsRetry: false,
        retriesLeft: maxRetries,
        message: 'Valid book cover image detected.'
      };
    } else {
      // Not a valid book cover
      return {
        isValid: false,
        needsRetry: maxRetries > 0,
        retriesLeft: maxRetries,
        message: `The image does not appear to be a book cover. ${maxRetries > 0 ? `Please upload a different image (${maxRetries} attempts remaining).` : 'No more attempts remaining.'}`
      };
    }
  } catch (error) {
    console.error('Error in validateBookCoverWithRetry:', error);
    
    // In case of error, give the user another chance if retries are available
    return {
      isValid: false,
      needsRetry: maxRetries > 0,
      retriesLeft: maxRetries,
      message: `Error processing the image. ${maxRetries > 0 ? `Please try again (${maxRetries} attempts remaining).` : 'No more attempts remaining.'}`
    };
  }
}

/**
 * Processes a book cover image to extract information and validate it
 * @param imagePath Path to the book cover image
 * @param maxRetries Maximum number of retries allowed (default: 3)
 * @returns Promise with processing result, book information, and retry details
 */
export async function processBookCoverImage(
  imagePath: string,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  isValid: boolean;
  needsRetry: boolean;
  retriesLeft: number;
  message: string;
  bookInfo?: {
    title: string;
    author: string;
    isFiction?: boolean;
  };
}> {
  try {
    // First, validate if the image is a book cover
    const validationResult = await validateBookCoverWithRetry(imagePath, maxRetries);
    
    if (!validationResult.isValid) {
      // If not a valid book cover, return the validation result
      return {
        success: false,
        ...validationResult
      };
    }
    
    // If it's a valid book cover, extract title and author
    const { title, author } = await extractBookTitleAndAuthor(imagePath);
    
    // Classify the book as fiction or non-fiction
    const classification = await classifyBook(imagePath, title, author);
    
    return {
      success: true,
      isValid: true,
      needsRetry: false,
      retriesLeft: maxRetries,
      message: 'Book cover processed successfully.',
      bookInfo: {
        title,
        author,
        isFiction: classification.isFiction
      }
    };
  } catch (error) {
    console.error('Error processing book cover image:', error);
    
    return {
      success: false,
      isValid: false,
      needsRetry: maxRetries > 0,
      retriesLeft: maxRetries,
      message: `Error processing the book cover. ${maxRetries > 0 ? `Please try again (${maxRetries} attempts remaining).` : 'No more attempts remaining.'}`
    };
  }
}

/**
 * Complete flow to process a book cover image, validate it, and extract preview text
 * @param imagePath Path to the book cover image
 * @param pdfScraperService Instance of PdfScraperService
 * @param maxRetries Maximum number of retries allowed (default: 3)
 * @returns Promise with complete processing result
 */
export async function processBookCoverAndExtractPreview(
  imagePath: string,
  pdfScraperService: PdfScraperService,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  isValid: boolean;
  needsRetry: boolean;
  retriesLeft: number;
  message: string;
  bookInfo?: {
    title: string;
    author: string;
    isFiction?: boolean;
    isbn?: string;
  };
  previewText?: string | null;
}> {
  try {
    // Process the book cover image
    const processResult = await processBookCoverImage(imagePath, maxRetries);
    
    // If the image is not valid or processing failed
    if (!processResult.success || !processResult.isValid) {
      return processResult;
    }
    
    // If we have valid book info, try to extract preview text
    const bookInfo = processResult.bookInfo!;
    console.log(`Extracting preview for book: "${bookInfo.title}" by ${bookInfo.author}`);
    
    // Use the PdfScraperService to find the book preview
    const previewText = await pdfScraperService.findBookPdf(
      bookInfo.title,
      bookInfo.author
    );
    
    if (previewText) {
      return {
        ...processResult,
        message: 'Book cover processed and preview text extracted successfully.',
        previewText
      };
    } else {
      return {
        ...processResult,
        message: 'Book cover is valid, but could not extract preview text. The book may not be available in Google Books.',
        previewText: null
      };
    }
  } catch (error) {
    console.error('Error in processBookCoverAndExtractPreview:', error);
    
    return {
      success: false,
      isValid: false,
      needsRetry: maxRetries > 0,
      retriesLeft: maxRetries,
      message: `Error processing the book cover and extracting preview. ${maxRetries > 0 ? `Please try again (${maxRetries} attempts remaining).` : 'No more attempts remaining.'}`
    };
  }
}

/**
 * Handles the retry flow for book cover image validation and processing
 * @param imagePath Path to the current image
 * @param pdfScraperService Instance of PdfScraperService
 * @param currentRetry Current retry attempt (default: 0)
 * @param maxRetries Maximum number of retries allowed (default: 3)
 * @returns Promise with processing result and retry information
 */
export async function handleBookCoverRetryFlow(
  imagePath: string,
  pdfScraperService: PdfScraperService,
  currentRetry: number = 0,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  isValid: boolean;
  needsRetry: boolean;
  retriesLeft: number;
  message: string;
  currentAttempt: number;
  bookInfo?: {
    title: string;
    author: string;
    isFiction?: boolean;
  };
  previewText?: string | null;
}> {
  // Calculate retries left
  const retriesLeft = Math.max(0, maxRetries - currentRetry);
  
  console.log(`Processing book cover image (Attempt ${currentRetry + 1}/${maxRetries + 1})`);
  
  // Process the image
  const result = await processBookCoverAndExtractPreview(
    imagePath,
    pdfScraperService,
    retriesLeft
  );
  
  return {
    ...result,
    currentAttempt: currentRetry + 1
  };
} 