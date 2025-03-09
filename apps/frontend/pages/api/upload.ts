import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import { uploadToStorage } from '../../lib/storage';
import fs from 'fs';
import { processBookCover } from '../../../../apps/backend/src/services/imageProcessor';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    // Process the form data
    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Get the uploaded file
    const file = files.coverImage?.[0];
    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the file
    const fileData = fs.readFileSync(file.filepath);
    
    // Upload to Vercel Blob Storage
    const imageUrl = await uploadToStorage(fileData, `book-cover-${Date.now()}.jpg`);
    
    // Process the book cover
    const bookData = await processBookCover(imageUrl);
    
    // Return the book data
    return res.status(200).json({
      success: true,
      bookData,
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
} 