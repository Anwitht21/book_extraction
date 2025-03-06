"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ENDPOINTS = void 0;
exports.isValidISBN = isValidISBN;
// API endpoints
exports.API_ENDPOINTS = {
    UPLOAD_IMAGE: '/api/upload',
    GET_BOOK_DATA: '/api/book'
};
// Utility functions
function isValidISBN(isbn) {
    // Basic ISBN validation (simplified)
    return /^(?:\d[- ]?){9}[\dXx]$/.test(isbn) || /^(?:\d[- ]?){13}$/.test(isbn);
}
