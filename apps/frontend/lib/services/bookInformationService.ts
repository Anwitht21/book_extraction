import axios from 'axios';

/**
 * Service for retrieving book information and preview text using Google Books API
 */
export class BookInformationService {
  private readonly apiKey: string;
  
  constructor() {
    // Get Google Books API key from environment variables
    this.apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('GOOGLE_BOOKS_API_KEY environment variable is not set. Some functionality may be limited.');
    }
  }

  /**
   * Find a book by ISBN
   * @param isbn ISBN to search for
   * @returns Promise with book preview text or null if not found
   */
  async findBookByIsbn(isbn: string): Promise<string | null> {
    try {
      console.log(`Searching for book with ISBN: ${isbn}`);
      
      if (!this.apiKey) {
        return null;
      }
      
      // Build search query specifically for ISBN
      const query = `isbn:${isbn}`;
      
      // Get book information from Google Books API
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
        params: {
          q: query,
          key: this.apiKey
        }
      });
      
      const data = response.data;
      
      if (!data.items || data.items.length === 0) {
        console.log(`No books found with ISBN: ${isbn}`);
        return null;
      }
      
      // Get the first book
      const book = data.items[0];
      
      // Extract preview text if available
      if (book.volumeInfo && book.volumeInfo.description) {
        return book.volumeInfo.description;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding book by ISBN:', error);
      return null;
    }
  }

  /**
   * Find book information and preview text by title and author
   * @param title Book title to search for
   * @param author Book author (optional)
   * @param isbn ISBN (optional) - if provided, will be used to prioritize matching editions
   * @returns Promise with book preview text or null if not found
   */
  async findBookInformation(title: string, author?: string, isbn?: string): Promise<string | null> {
    try {
      console.log(`Searching for preview of "${title}" ${author ? `by ${author}` : ''} ${isbn ? `ISBN: ${isbn}` : ''}`);
      
      // If ISBN is provided, try searching by ISBN first
      if (isbn) {
        console.log(`Trying to find book with ISBN: ${isbn}`);
        const isbnResult = await this.findBookByIsbn(isbn);
        if (isbnResult) {
          console.log(`Found book by ISBN: ${isbn}`);
          return isbnResult;
        }
        console.log(`No preview available for ISBN: ${isbn}, falling back to title/author search`);
      }
      
      if (!this.apiKey) {
        return null;
      }
      
      // Build search query
      let query = `intitle:${title}`;
      if (author) {
        query += `+inauthor:${author}`;
      }
      
      // Get book information from Google Books API
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
        params: {
          q: query,
          key: this.apiKey
        }
      });
      
      const data = response.data;
      
      if (!data.items || data.items.length === 0) {
        console.log(`No books found with title: ${title}`);
        return null;
      }
      
      // Get the first book
      const book = data.items[0];
      
      // Extract preview text if available
      if (book.volumeInfo && book.volumeInfo.description) {
        return book.volumeInfo.description;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding book preview:', error);
      return null;
    }
  }
} 