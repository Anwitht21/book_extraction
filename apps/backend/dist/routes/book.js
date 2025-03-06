"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookRoutes = void 0;
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Mock database for demonstration purposes
const bookDatabase = {
    '9781234567897': {
        title: 'The Great Novel',
        author: 'Jane Doe',
        isbn: '9781234567897',
        publisher: 'Example Press',
        publicationYear: 2022,
        description: 'A fascinating story about technology and humanity.'
    },
    '9789876543210': {
        title: 'Programming Concepts',
        author: 'John Smith',
        isbn: '9789876543210',
        publisher: 'Tech Books Inc.',
        publicationYear: 2021,
        description: 'A comprehensive guide to modern programming paradigms.'
    }
};
// Get book data by ISBN
router.get('/:isbn', (req, res) => {
    const { isbn } = req.params;
    if (!isbn) {
        return res.status(400).json({
            success: false,
            message: 'ISBN is required',
            error: 'Please provide a valid ISBN'
        });
    }
    const bookData = bookDatabase[isbn];
    if (!bookData) {
        return res.status(404).json({
            success: false,
            message: 'Book not found',
            error: `No book found with ISBN: ${isbn}`
        });
    }
    return res.status(200).json({
        success: true,
        message: 'Book data retrieved successfully',
        bookData
    });
});
exports.bookRoutes = router;
