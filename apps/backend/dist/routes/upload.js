"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const imageProcessor_1 = require("../services/imageProcessor");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
// Handle book cover image upload
router.post('/', upload.single('coverImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
                error: 'Please upload a book cover image'
            });
        }
        // Process the uploaded image
        const result = await (0, imageProcessor_1.processBookCover)(req.file.path);
        return res.status(200).json({
            success: true,
            message: 'Image processed successfully',
            bookData: result
        });
    }
    catch (error) {
        console.error('Error processing image:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process image',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.uploadRoutes = router;
