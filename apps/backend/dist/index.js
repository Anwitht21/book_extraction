"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const upload_1 = require("./routes/upload");
const book_1 = require("./routes/book");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables from .env file
const envPath = path_1.default.resolve(process.cwd(), '.env');
if (fs_1.default.existsSync(envPath)) {
    console.log('Loading environment variables from .env file:', envPath);
    require('dotenv').config({ path: envPath });
}
else {
    console.warn('No .env file found. Make sure to set OPENAI_API_KEY and GOOGLE_BOOKS_API_KEY environment variables.');
}
// Check for required API keys
if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not set. Some features may not work properly.');
}
if (!process.env.GOOGLE_BOOKS_API_KEY) {
    console.warn('GOOGLE_BOOKS_API_KEY is not set. Book content retrieval may be limited.');
}
// Ensure temp directory exists for PDF downloads
const tempDir = path_1.default.join(process.cwd(), 'temp');
if (!fs_1.default.existsSync(tempDir)) {
    console.log('Creating temp directory for PDF downloads:', tempDir);
    fs_1.default.mkdirSync(tempDir, { recursive: true });
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/upload', upload_1.uploadRoutes);
app.use('/api/book', book_1.bookRoutes);
// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint called');
    res.status(200).json({ message: 'Backend is working!' });
});
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
