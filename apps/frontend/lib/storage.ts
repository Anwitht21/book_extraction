import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Vercel Blob Storage
 * @param file File to upload
 * @param filename Optional filename (will generate UUID-based name if not provided)
 * @returns URL of the uploaded file
 */
export async function uploadToStorage(
  file: Buffer | ArrayBuffer,
  filename?: string
): Promise<string> {
  try {
    // Generate a unique filename if not provided
    const uniqueFilename = filename || `${uuidv4()}.jpg`;
    
    // Upload to Vercel Blob Storage
    const blob = await put(uniqueFilename, file, {
      access: 'public',
    });
    
    return blob.url;
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    throw new Error('Failed to upload file to storage');
  }
} 