"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBookCover = processBookCover;
const tesseract_js_1 = require("tesseract.js");
const shared_1 = require("shared");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const openaiService_1 = require("./openaiService");
const googleBooksService_1 = require("./googleBooksService");
const pdfScraperService_1 = require("./pdfScraperService");
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    console.log('Creating uploads directory:', uploadsDir);
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Initialize Google Books Service
const googleBooksService = new googleBooksService_1.GoogleBooksService();
// Initialize PDF Scraper Service
const pdfScraperService = new pdfScraperService_1.PdfScraperService();
/**
 * Process a book cover image to extract book data
 * @param imagePath Path to the uploaded image
 * @returns Promise with book data
 */
function processBookCover(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Processing image: ${imagePath}`);
            // Verify the file exists
            if (!fs_1.default.existsSync(imagePath)) {
                console.error(`File does not exist: ${imagePath}`);
                throw new Error(`File does not exist: ${imagePath}`);
            }
            // Step 1: Validate the image is a book cover using OpenAI GPT-4o mini
            console.log('Step 1: Validating image is a book cover using OpenAI GPT-4o mini');
            const isValidBookCover = yield (0, openaiService_1.isBookCover)(imagePath);
            if (!isValidBookCover) {
                console.log('Image validation failed: Not a book cover');
                throw new Error('The uploaded image does not appear to be a book cover. Please retake the photo.');
            }
            console.log('Image validation passed: This is a book cover');
            // Step 2: Extract book title and author using OpenAI GPT-4o mini
            console.log('Step 2: Extracting book title and author using OpenAI GPT-4o mini');
            const { title: extractedTitle, author: extractedAuthor } = yield (0, openaiService_1.extractBookTitleAndAuthor)(imagePath);
            console.log('Extracted title:', extractedTitle);
            console.log('Extracted author:', extractedAuthor);
            // Step 3: Initialize Tesseract.js worker for OCR (for additional text extraction)
            console.log('Step 3: Initializing OCR for additional text extraction');
            const worker = yield (0, tesseract_js_1.createWorker)();
            // Step 4: Recognize text from the image
            console.log('Step 4: Recognizing text from image');
            const result = yield worker.recognize(imagePath);
            yield worker.terminate();
            console.log('Recognized text:', result.data.text.substring(0, 100) + '...');
            // Step 5: Extract ISBN and other data from the recognized text
            console.log('Step 5: Extracting ISBN and other data from text');
            const extractedData = extractBookData(result.data.text, extractedTitle, extractedAuthor);
            console.log('Extracted data:', extractedData);
            // Step 6: Identify the book using Open Library API
            console.log('Step 6: Identifying book using Open Library API');
            const bookInfo = yield identifyBookByTitle(extractedData.title, extractedData.author);
            console.log('Book info from API:', bookInfo);
            // Step 7: Get more accurate book details from Google Books API
            console.log('Step 7: Getting book details from Google Books API');
            const bookTitle = (bookInfo === null || bookInfo === void 0 ? void 0 : bookInfo.title) || extractedData.title;
            const bookAuthor = (bookInfo === null || bookInfo === void 0 ? void 0 : bookInfo.author) || extractedData.author;
            const googleBooksDetails = yield googleBooksService.getBookDetails(bookTitle, bookAuthor);
            console.log('Google Books details:', googleBooksDetails);
            // Step 8: Classify the book as fiction or non-fiction using OpenAI GPT-4o mini
            console.log('Step 8: Classifying book as fiction or non-fiction using OpenAI GPT-4o mini');
            const finalTitle = googleBooksDetails.title || bookTitle;
            const finalAuthor = googleBooksDetails.author || bookAuthor;
            const classification = yield (0, openaiService_1.classifyBook)(imagePath, finalTitle, finalAuthor);
            console.log('Book classification:', classification);
            // Step 9: Try to get full book text from PDF scraper
            console.log('Step 9: Searching for full book text from PDF');
            let extractedText = '';
            let pdfText = null;
            try {
                // Make multiple attempts to find the PDF with different search variations
                console.log('Attempting to find PDF with multiple search variations...');
                pdfText = yield pdfScraperService.findBookPdf(finalTitle, finalAuthor, classification.isFiction);
            }
            catch (error) {
                console.error('Error finding PDF:', error);
                pdfText = null;
            }
            if (pdfText) {
                console.log('Found book text from PDF or alternative source');
                extractedText = pdfText;
            }
            else {
                // Step 10: If no PDF found, use OpenAI to generate sample text
                console.log('Step 10: No PDF found, using OpenAI to generate sample text');
                extractedText = yield (0, openaiService_1.extractBookText)(finalTitle, finalAuthor, classification.isFiction);
                console.log('Generated text from OpenAI:', extractedText.substring(0, 100) + '...');
            }
            // Step 11: Fetch book excerpt if available (as a fallback for description)
            console.log('Step 11: Fetching book excerpt for description');
            let description = googleBooksDetails.description || '';
            if (!description && bookInfo && bookInfo.openLibraryID) {
                description = yield fetchBookExcerpt(bookInfo.openLibraryID);
                console.log('Fetched description from Open Library:', description.substring(0, 100) + '...');
            }
            else {
                console.log('Using Google Books description or no Open Library ID available');
            }
            // Step 12: Combine all data
            console.log('Step 12: Combining all data');
            const bookData = {
                title: finalTitle,
                author: finalAuthor,
                isbn: googleBooksDetails.isbn || (bookInfo === null || bookInfo === void 0 ? void 0 : bookInfo.isbn) || extractedData.isbn,
                publisher: googleBooksDetails.publisher || (bookInfo === null || bookInfo === void 0 ? void 0 : bookInfo.publisher),
                publicationYear: googleBooksDetails.publicationYear || (bookInfo === null || bookInfo === void 0 ? void 0 : bookInfo.publicationYear),
                description: description || 'No description available',
                coverImageUrl: googleBooksDetails.coverImageUrl || (bookInfo === null || bookInfo === void 0 ? void 0 : bookInfo.coverImageUrl),
                extractedText: extractedText,
                classification: classification
            };
            console.log('Final book data:', bookData);
            return bookData;
        }
        catch (error) {
            console.error('Error processing book cover:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to process book cover image');
        }
    });
}
/**
 * Validate if the image is likely a book cover
 * This is a simplified implementation that assumes any image with text is a book cover
 * In a production environment, you would use a more sophisticated image classification model
 * @param imagePath Path to the image
 * @returns Promise<boolean> True if the image is likely a book cover
 */
function validateImageIsBook(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Simple validation: Check if the image contains text using OCR
            const worker = yield (0, tesseract_js_1.createWorker)();
            const result = yield worker.recognize(imagePath);
            yield worker.terminate();
            // If the image contains a significant amount of text, it's likely a book cover
            const textLength = result.data.text.trim().length;
            return textLength > 20; // Arbitrary threshold
            // Note: In a production environment, you would use:
            // 1. A pre-trained image classification model (TensorFlow.js, etc.)
            // 2. A cloud service like Google Vision API or AWS Rekognition
            // 3. A multimodal model like CLIP to check similarity to "book cover"
        }
        catch (error) {
            console.error('Error validating image:', error);
            return false;
        }
    });
}
/**
 * Extract book data from recognized text
 * @param text Text recognized from the image
 * @param title Book title from OpenAI
 * @param author Book author from OpenAI
 * @returns Book data object with basic information
 */
function extractBookData(text, title, author) {
    // Look for ISBN pattern
    const isbnMatch = text.match(/(?:ISBN(?:-1[03])?:?\s*)?(?=[0-9X]{10}|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[- ]){4})[- 0-9]{17})/i);
    const isbn = isbnMatch ? isbnMatch[0].replace(/[^0-9X]/gi, '') : '0000000000000';
    return {
        title,
        author,
        isbn: (0, shared_1.isValidISBN)(isbn) ? isbn : '0000000000000'
    };
}
/**
 * Identify a book by title and author using Open Library API
 * @param title Book title
 * @param author Book author
 * @returns Promise with book information or null if not found
 */
function identifyBookByTitle(title, author) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Construct search query
            const query = `title=${encodeURIComponent(title)}${author ? `+author=${encodeURIComponent(author)}` : ''}`;
            const url = `https://openlibrary.org/search.json?${query}`;
            // Fetch results from Open Library
            const response = yield (0, node_fetch_1.default)(url);
            const data = yield response.json();
            // Check if we have results
            if (!data.docs || data.docs.length === 0) {
                console.log('No books found for query:', query);
                return null;
            }
            // Get the first (most relevant) result
            const book = data.docs[0];
            // Extract cover image URL if available
            let coverImageUrl;
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
        }
        catch (error) {
            console.error('Error identifying book:', error);
            return null;
        }
    });
}
/**
 * Fetch book excerpt or description from Open Library
 * @param openLibraryID Open Library work ID
 * @returns Promise with book excerpt or empty string if not available
 */
function fetchBookExcerpt(openLibraryID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch work data from Open Library
            const url = `https://openlibrary.org${openLibraryID}.json`;
            const response = yield (0, node_fetch_1.default)(url);
            const workData = yield response.json();
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
        }
        catch (error) {
            console.error('Error fetching book excerpt:', error);
            return 'Error retrieving book excerpt';
        }
    });
}
