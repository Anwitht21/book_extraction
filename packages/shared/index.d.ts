/**
 * Book classification information
 */
export interface BookClassification {
  isFiction: boolean;
  confidence: number;
}

/**
 * Book data structure
 */
export interface BookData {
  title: string;
  author: string;
  isbn: string;
  publisher?: string;
  publicationYear?: number;
  description?: string;
  coverImageUrl?: string;
  extractedText?: string;
  embeddedViewerHtml?: string;
  classification: BookClassification;
}

/**
 * Response from image upload API
 */
export interface ImageUploadResponse {
  success: boolean;
  bookData?: BookData;
  error?: string;
}

/**
 * Validates if a string is a valid ISBN-10 or ISBN-13
 * @param isbn ISBN string to validate
 * @returns true if valid, false otherwise
 */
export function isValidISBN(isbn: string): boolean; 