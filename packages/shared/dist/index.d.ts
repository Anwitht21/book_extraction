export interface BookData {
    title: string;
    author: string;
    isbn: string;
    publisher?: string;
    publicationYear?: number;
    coverImageUrl?: string;
    description?: string;
    extractedText?: string;
    classification?: BookClassification;
    pageCount?: number;
    categories?: string[];
}
export interface BookClassification {
    isFiction: boolean;
    confidence: number;
}
export interface ImageUploadResponse {
    success: boolean;
    message: string;
    bookData?: BookData;
    error?: string;
}
export declare const API_ENDPOINTS: {
    UPLOAD_IMAGE: string;
    GET_BOOK_DATA: string;
};
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare function isValidISBN(isbn: string): boolean;
