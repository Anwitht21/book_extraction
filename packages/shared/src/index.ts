// Book data interface
export interface BookData {
  title: string;
  author: string;
  isbn: string;
  publisher?: string;
  publicationYear?: number;
  coverImageUrl?: string;
  description?: string;
}

// Image upload response
export interface ImageUploadResponse {
  success: boolean;
  message: string;
  bookData?: BookData;
  error?: string;
}

// API endpoints
export const API_ENDPOINTS = {
  UPLOAD_IMAGE: '/api/upload',
  GET_BOOK_DATA: '/api/book'
};

// Validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Utility functions
export function isValidISBN(isbn: string): boolean {
  // Basic ISBN validation (simplified)
  return /^(?:\d[- ]?){9}[\dXx]$/.test(isbn) || /^(?:\d[- ]?){13}$/.test(isbn);
} 