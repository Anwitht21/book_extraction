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