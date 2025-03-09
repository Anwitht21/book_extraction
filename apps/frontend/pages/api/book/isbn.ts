import { NextApiRequest, NextApiResponse } from 'next';
import { BookInformationService } from '../../../lib/services/bookInformationService';

// Initialize Book Information Service
const bookInfoService = new BookInformationService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { isbn } = req.query;

    // Validate required parameters
    if (!isbn) {
      return res.status(400).json({ error: 'ISBN is required' });
    }

    // Get book preview text by ISBN
    const previewText = await bookInfoService.findBookByIsbn(isbn as string);

    if (!previewText) {
      return res.status(404).json({ error: 'No preview available for this ISBN' });
    }

    return res.status(200).json({ 
      success: true,
      previewText 
    });
  } catch (error) {
    console.error('Error getting book by ISBN:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
} 