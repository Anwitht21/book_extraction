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
export function isValidISBN(isbn: string): boolean {
  // Remove hyphens and spaces
  const cleanedISBN = isbn.replace(/[-\s]/g, '');
  
  // Check if it's a valid ISBN-10
  if (cleanedISBN.length === 10) {
    // ISBN-10 validation
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const digit = parseInt(cleanedISBN[i]);
      if (isNaN(digit)) return false;
      sum += digit * (10 - i);
    }
    
    // Check digit can be 'X' (representing 10)
    const lastChar = cleanedISBN[9].toUpperCase();
    const lastDigit = lastChar === 'X' ? 10 : parseInt(lastChar);
    if (isNaN(lastDigit) && lastChar !== 'X') return false;
    
    sum += lastDigit;
    return sum % 11 === 0;
  }
  
  // Check if it's a valid ISBN-13
  if (cleanedISBN.length === 13) {
    // ISBN-13 validation
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const digit = parseInt(cleanedISBN[i]);
      if (isNaN(digit)) return false;
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    return sum % 10 === 0;
  }
  
  // Not a valid ISBN format
  return false;
} 