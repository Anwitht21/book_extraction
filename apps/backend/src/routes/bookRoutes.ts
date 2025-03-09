import express from 'express';
import * as bookController from '../controllers/bookController';

const router = express.Router();

// Route for getting book preview by title and author
router.get('/preview', bookController.getBookPreview);

// Route for getting book by ISBN
router.get('/isbn', bookController.getBookByIsbn);

// Route for processing book cover image
router.post('/cover', bookController.upload.single('image'), bookController.processBookCover);

export const bookRoutes = router; 