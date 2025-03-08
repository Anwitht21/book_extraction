"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const imageProcessor_1 = require("../services/imageProcessor");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    console.log('Creating uploads directory');
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Use memory storage instead of disk storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('Multer: Filtering file', file.mimetype);
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            console.log('Multer: Rejected non-image file');
            cb(new Error('Only image files are allowed'));
        }
    }
});
// Handle book cover image upload
router.post('/', upload.single('coverImage'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Upload route: Received request');
    try {
        if (!req.file) {
            console.log('Upload route: No file in request');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
                error: 'Please upload a book cover image'
            });
        }
        console.log('Upload route: File received in memory', req.file.originalname);
        // Save the file to disk temporarily
        const filePath = path_1.default.join(uploadsDir, Date.now() + '-' + req.file.originalname);
        fs_1.default.writeFileSync(filePath, req.file.buffer);
        console.log('Upload route: Saved file to disk at', filePath);
        // Process the uploaded image
        console.log('Upload route: Processing image');
        const result = yield (0, imageProcessor_1.processBookCover)(filePath);
        // Clean up the temporary file
        fs_1.default.unlinkSync(filePath);
        console.log('Upload route: Cleaned up temporary file');
        console.log('Upload route: Processing complete, sending response');
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
}));
exports.uploadRoutes = router;
