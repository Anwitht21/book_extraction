"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBookCover = processBookCover;
const tesseract_js_1 = require("tesseract.js");
const shared_1 = require("shared");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
/**
 * Process a book cover image to extract book data
 * @param imagePath Path to the uploaded image
 * @returns Promise with book data
 */
async function processBookCover(imagePath) {
    try {
        // Initialize Tesseract.js worker
        const worker = await (0, tesseract_js_1.createWorker)('eng');
        // Recognize text from the image
        const { data } = await worker.recognize(imagePath);
        await worker.terminate();
        // Extract book data from the recognized text
        const bookData = extractBookData(data.text);
        // Clean up the uploaded file after processing
        // fs.unlinkSync(imagePath); // Uncomment to delete file after processing
        return bookData;
    }
    catch (error) {
        console.error('Error processing book cover:', error);
        throw new Error('Failed to process book cover image');
    }
}
/**
 * Extract book data from recognized text
 * @param text Text recognized from the image
 * @returns Book data object
 */
function extractBookData(text) {
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
        isbn: (0, shared_1.isValidISBN)(isbn) ? isbn : '0000000000000'
    };
}
